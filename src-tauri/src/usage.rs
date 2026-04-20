use serde::Serialize;
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// 单个 Skill 的调用统计
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillCallRecord {
    pub call_count: u64,
    pub last_called_at: Option<String>,
}

pub type SkillCallMap = HashMap<String, SkillCallRecord>;

/// 扫描 Claude Code + Codex 的日志，返回每个 skill 的调用次数
pub fn scan_skill_usage() -> SkillCallMap {
    let home = match std::env::var("HOME") {
        Ok(h) => std::path::PathBuf::from(h),
        Err(_) => return HashMap::new(),
    };

    // skill_name -> Vec<ISO timestamp>  (每次独立调用一条)
    let mut invocations: HashMap<String, Vec<String>> = HashMap::new();

    // Claude Code: ~/.claude/projects/**/*.jsonl
    let claude_dir = home.join(".claude").join("projects");
    if claude_dir.exists() {
        scan_claude_projects(&claude_dir, &mut invocations);
    }

    // Codex: ~/.codex/sessions/**/*.jsonl
    let codex_dir = home.join(".codex").join("sessions");
    if codex_dir.exists() {
        scan_codex_sessions(&codex_dir, &mut invocations);
    }

    invocations
        .into_iter()
        .map(|(name, mut timestamps)| {
            timestamps.sort();
            let last = timestamps.last().cloned();
            (
                name,
                SkillCallRecord {
                    call_count: timestamps.len() as u64,
                    last_called_at: last,
                },
            )
        })
        .collect()
}

// ─── Claude Code ──────────────────────────────────────────────────────────────
//
// 日志格式：~/.claude/projects/<project-dir>/<session>.jsonl
// 调用记录：type="user", message.content[].type="tool_result",
//            content = "Launching skill: <name>"

fn scan_claude_projects(dir: &Path, invocations: &mut HashMap<String, Vec<String>>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            // project 子目录，里面直接是 .jsonl
            if let Ok(sub) = fs::read_dir(&path) {
                for se in sub.flatten() {
                    let p = se.path();
                    if is_jsonl(&p) {
                        parse_claude_jsonl(&p, invocations);
                    }
                }
            }
        } else if is_jsonl(&path) {
            parse_claude_jsonl(&path, invocations);
        }
    }
}

fn parse_claude_jsonl(path: &Path, invocations: &mut HashMap<String, Vec<String>>) {
    let Ok(content) = fs::read_to_string(path) else {
        return;
    };
    for line in content.lines() {
        if line.trim().is_empty() {
            continue;
        }
        let Ok(entry) = serde_json::from_str::<Value>(line) else {
            continue;
        };
        if entry.get("type").and_then(|t| t.as_str()) != Some("user") {
            continue;
        }
        let timestamp = entry
            .get("timestamp")
            .and_then(|t| t.as_str())
            .unwrap_or("")
            .to_string();

        let Some(content_arr) = entry
            .get("message")
            .and_then(|m| m.get("content"))
            .and_then(|c| c.as_array())
        else {
            continue;
        };

        for block in content_arr {
            if block.get("type").and_then(|t| t.as_str()) != Some("tool_result") {
                continue;
            }
            for skill_name in extract_claude_skill_names(block) {
                invocations
                    .entry(skill_name)
                    .or_default()
                    .push(timestamp.clone());
            }
        }
    }
}

/// 从 tool_result block 里提取 "Launching skill: <name>"
fn extract_claude_skill_names(block: &Value) -> Vec<String> {
    let mut results = Vec::new();
    match block.get("content") {
        Some(Value::String(s)) => {
            if let Some(n) = parse_launching_skill(s) {
                results.push(n);
            }
        }
        Some(Value::Array(arr)) => {
            for item in arr {
                if let Some(text) = item.get("text").and_then(|t| t.as_str()) {
                    if let Some(n) = parse_launching_skill(text) {
                        results.push(n);
                    }
                }
            }
        }
        _ => {}
    }
    results
}

fn parse_launching_skill(text: &str) -> Option<String> {
    const PREFIX: &str = "Launching skill: ";
    let pos = text.find(PREFIX)?;
    let name = text[pos + PREFIX.len()..].trim().to_string();
    if name.is_empty() {
        None
    } else {
        Some(name)
    }
}

// ─── Codex ────────────────────────────────────────────────────────────────────
//
// 日志格式：~/.codex/sessions/YYYY/MM/DD/<session>.jsonl
// 调用记录：type="response_item", payload.type="function_call",
//            payload.name="exec_command",
//            payload.arguments.cmd 包含 "/path/to/<skill-name>/SKILL.md"
// 去重策略：同一 session 中同一 skill 只计一次

fn scan_codex_sessions(dir: &Path, invocations: &mut HashMap<String, Vec<String>>) {
    scan_codex_recursive(dir, invocations);
}

fn scan_codex_recursive(dir: &Path, invocations: &mut HashMap<String, Vec<String>>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            scan_codex_recursive(&path, invocations);
        } else if is_jsonl(&path) {
            parse_codex_jsonl(&path, invocations);
        }
    }
}

fn parse_codex_jsonl(path: &Path, invocations: &mut HashMap<String, Vec<String>>) {
    let Ok(content) = fs::read_to_string(path) else {
        return;
    };

    // 同一文件（session）内：skill_name -> 首次调用时间戳
    let mut seen: HashMap<String, String> = HashMap::new();

    for line in content.lines() {
        if line.trim().is_empty() {
            continue;
        }
        let Ok(entry) = serde_json::from_str::<Value>(line) else {
            continue;
        };

        if entry.get("type").and_then(|t| t.as_str()) != Some("response_item") {
            continue;
        }

        let Some(payload) = entry.get("payload").and_then(|p| p.as_object()) else {
            continue;
        };
        if payload.get("type").and_then(|t| t.as_str()) != Some("function_call") {
            continue;
        }
        if payload.get("name").and_then(|n| n.as_str()) != Some("exec_command") {
            continue;
        }

        let Some(args_str) = payload.get("arguments").and_then(|a| a.as_str()) else {
            continue;
        };
        let Ok(args) = serde_json::from_str::<Value>(args_str) else {
            continue;
        };
        let cmd = args.get("cmd").and_then(|c| c.as_str()).unwrap_or("");

        if let Some(skill_name) = extract_skill_name_from_cmd(cmd) {
            let ts = entry
                .get("timestamp")
                .and_then(|t| t.as_str())
                .unwrap_or("")
                .to_string();
            // 同 session 内同一 skill 只记录首次
            seen.entry(skill_name).or_insert(ts);
        }
    }

    for (skill_name, timestamp) in seen {
        invocations.entry(skill_name).or_default().push(timestamp);
    }
}

/// 从 exec_command 的 cmd 字段中提取 skill 名（父目录名）
/// 例：`sed -n '1,220p' /Users/lick/.codex/skills/find-skills/SKILL.md`
///   → "find-skills"
fn extract_skill_name_from_cmd(cmd: &str) -> Option<String> {
    // 兼容 Windows 系统的反斜杠 \SKILL.md 和 /SKILL.md
    let normalized_cmd = cmd.replace('\\', "/");
    let pos = normalized_cmd.find("/SKILL.md")?;
    let before = &normalized_cmd[..pos];
    let name = before.split('/').last()?;
    if name.is_empty() || name.starts_with('.') {
        return None;
    }
    Some(name.to_string())
}

// ─── helpers ──────────────────────────────────────────────────────────────────

fn is_jsonl(path: &Path) -> bool {
    path.extension().and_then(|e| e.to_str()) == Some("jsonl")
}
