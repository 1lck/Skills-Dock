use serde::Serialize;
use serde_json::{Map, Value};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

/// 单个 Skill 的调用统计
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillCallRecord {
    pub call_count: u64,
    pub last_called_at: Option<String>,
}

pub type SkillCallMap = HashMap<String, SkillCallRecord>;

/// 扫描 Claude、Codex、Gemini、OpenCode 的本地会话记录，返回每个 skill 的调用次数
pub fn scan_skill_usage() -> SkillCallMap {
    let roots = match UsageRoots::from_system() {
        Some(roots) => roots,
        None => return HashMap::new(),
    };

    scan_skill_usage_in_roots(&roots)
}

fn scan_skill_usage_in_roots(roots: &UsageRoots) -> SkillCallMap {
    // skill_name -> Vec<ISO timestamp> (每次独立调用一条)
    let mut invocations: HashMap<String, Vec<String>> = HashMap::new();

    for claude_dir in &roots.claude_project_dirs {
        if claude_dir.exists() {
            scan_claude_projects(claude_dir, &mut invocations);
        }
    }

    for codex_dir in &roots.codex_session_dirs {
        if codex_dir.exists() {
            scan_codex_sessions(codex_dir, &mut invocations);
        }
    }

    for gemini_dir in &roots.gemini_session_dirs {
        if gemini_dir.exists() {
            scan_gemini_sessions(gemini_dir, &mut invocations);
        }
    }

    for opencode_dir in &roots.opencode_message_dirs {
        if opencode_dir.exists() {
            scan_opencode_messages(opencode_dir, &mut invocations);
        }
    }

    invocations
        .into_iter()
        .map(|(name, mut timestamps)| {
            timestamps.sort();
            let last = timestamps.last().filter(|value| !value.is_empty()).cloned();
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

#[cfg_attr(not(test), allow(dead_code))]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum OsKind {
    Macos,
    Linux,
    Windows,
}

impl OsKind {
    fn current() -> Self {
        #[cfg(target_os = "macos")]
        {
            return Self::Macos;
        }

        #[cfg(target_os = "windows")]
        {
            return Self::Windows;
        }

        #[cfg(not(any(target_os = "macos", target_os = "windows")))]
        {
            Self::Linux
        }
    }
}

#[derive(Clone, Debug, Default)]
struct UsageEnv {
    home: Option<PathBuf>,
    user_profile: Option<PathBuf>,
    app_data: Option<PathBuf>,
    local_app_data: Option<PathBuf>,
    xdg_data_home: Option<PathBuf>,
    xdg_state_home: Option<PathBuf>,
    xdg_config_home: Option<PathBuf>,
}

impl UsageEnv {
    fn from_system() -> Self {
        Self {
            home: env::var_os("HOME").map(PathBuf::from),
            user_profile: env::var_os("USERPROFILE").map(PathBuf::from),
            app_data: env::var_os("APPDATA").map(PathBuf::from),
            local_app_data: env::var_os("LOCALAPPDATA").map(PathBuf::from),
            xdg_data_home: env::var_os("XDG_DATA_HOME").map(PathBuf::from),
            xdg_state_home: env::var_os("XDG_STATE_HOME").map(PathBuf::from),
            xdg_config_home: env::var_os("XDG_CONFIG_HOME").map(PathBuf::from),
        }
    }

    fn home_dir(&self) -> Option<&Path> {
        self.home.as_deref().or(self.user_profile.as_deref())
    }
}

#[derive(Clone, Debug, Default)]
struct UsageRoots {
    claude_project_dirs: Vec<PathBuf>,
    codex_session_dirs: Vec<PathBuf>,
    gemini_session_dirs: Vec<PathBuf>,
    opencode_message_dirs: Vec<PathBuf>,
}

impl UsageRoots {
    fn from_system() -> Option<Self> {
        Self::from_env(OsKind::current(), &UsageEnv::from_system())
    }

    fn from_env(os: OsKind, env: &UsageEnv) -> Option<Self> {
        let home = env.home_dir()?.to_path_buf();

        let claude_project_dirs = vec![home.join(".claude").join("projects")];
        let codex_session_dirs = vec![home.join(".codex").join("sessions")];
        let gemini_session_dirs = vec![home.join(".gemini").join("tmp")];

        let opencode_message_dirs = unique_paths(match os {
            OsKind::Macos => vec![
                home.join("Library/Application Support/opencode/storage/message"),
                home.join(".opencode").join("storage/message"),
            ],
            OsKind::Linux => {
                let data_home = env
                    .xdg_data_home
                    .clone()
                    .unwrap_or_else(|| home.join(".local/share"));
                let state_home = env
                    .xdg_state_home
                    .clone()
                    .unwrap_or_else(|| home.join(".local/state"));
                let config_home = env
                    .xdg_config_home
                    .clone()
                    .unwrap_or_else(|| home.join(".config"));

                vec![
                    data_home.join("opencode/storage/message"),
                    state_home.join("opencode/storage/message"),
                    config_home.join("opencode/storage/message"),
                    home.join(".opencode").join("storage/message"),
                ]
            }
            OsKind::Windows => {
                let app_data = env
                    .app_data
                    .clone()
                    .unwrap_or_else(|| home.join("AppData/Roaming"));
                let local_app_data = env
                    .local_app_data
                    .clone()
                    .unwrap_or_else(|| home.join("AppData/Local"));

                vec![
                    app_data.join("opencode/storage/message"),
                    app_data.join("OpenCode/storage/message"),
                    local_app_data.join("opencode/storage/message"),
                    local_app_data.join("OpenCode/storage/message"),
                    home.join(".opencode").join("storage/message"),
                ]
            }
        });

        Some(Self {
            claude_project_dirs,
            codex_session_dirs,
            gemini_session_dirs,
            opencode_message_dirs,
        })
    }
}

fn unique_paths(paths: Vec<PathBuf>) -> Vec<PathBuf> {
    let mut unique = Vec::new();

    for path in paths {
        if !unique.iter().any(|existing| existing == &path) {
            unique.push(path);
        }
    }

    unique
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

fn extract_claude_skill_names(block: &Value) -> Vec<String> {
    let mut results = Vec::new();
    match block.get("content") {
        Some(Value::String(s)) => {
            results.extend(parse_launching_skill_names(s));
        }
        Some(Value::Array(arr)) => {
            for item in arr {
                if let Some(text) = item.get("text").and_then(|t| t.as_str()) {
                    results.extend(parse_launching_skill_names(text));
                }
            }
        }
        _ => {}
    }
    results
}

fn parse_launching_skill_names(text: &str) -> Vec<String> {
    const PREFIX: &str = "Launching skill: ";
    text.lines()
        .filter_map(|line| {
            let pos = line.find(PREFIX)?;
            normalize_skill_identifier(&line[pos + PREFIX.len()..])
        })
        .collect()
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
            seen.entry(skill_name).or_insert(ts);
        }
    }

    for (skill_name, timestamp) in seen {
        invocations.entry(skill_name).or_default().push(timestamp);
    }
}

// ─── Gemini ───────────────────────────────────────────────────────────────────
//
// Gemini CLI 会将项目级会话保存在 ~/.gemini/tmp/**/chats/*.json。
// 这里不依赖固定 schema，而是递归提取 activate_skill / SKILL.md 路径。

fn scan_gemini_sessions(dir: &Path, invocations: &mut HashMap<String, Vec<String>>) {
    scan_json_files_in_named_dirs(dir, "chats", invocations);
}

// ─── OpenCode ─────────────────────────────────────────────────────────────────
//
// OpenCode 不同版本/平台的本地消息目录位置不同。这里优先扫描常见的
// storage/message JSON 目录，递归提取 skill 工具调用与 SKILL.md 路径。

fn scan_opencode_messages(dir: &Path, invocations: &mut HashMap<String, Vec<String>>) {
    scan_json_files_recursive(dir, invocations);
}

// ─── Generic JSON scanners ────────────────────────────────────────────────────

fn scan_json_files_in_named_dirs(
    dir: &Path,
    target_dir_name: &str,
    invocations: &mut HashMap<String, Vec<String>>,
) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        if path.file_name().and_then(|name| name.to_str()) == Some(target_dir_name) {
            scan_json_files_recursive(&path, invocations);
            continue;
        }

        scan_json_files_in_named_dirs(&path, target_dir_name, invocations);
    }
}

fn scan_json_files_recursive(dir: &Path, invocations: &mut HashMap<String, Vec<String>>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            scan_json_files_recursive(&path, invocations);
        } else if is_json(&path) {
            parse_generic_json_file(&path, invocations);
        }
    }
}

fn parse_generic_json_file(path: &Path, invocations: &mut HashMap<String, Vec<String>>) {
    let Ok(content) = fs::read_to_string(path) else {
        return;
    };
    let Ok(value) = serde_json::from_str::<Value>(&content) else {
        return;
    };

    let fallback_timestamp = file_timestamp(path);
    let mut events = Vec::new();
    collect_skill_invocations_from_value(&value, None, &mut events);

    for (skill_name, timestamp) in events {
        invocations
            .entry(skill_name)
            .or_default()
            .push(timestamp.or_else(|| fallback_timestamp.clone()).unwrap_or_default());
    }
}

fn collect_skill_invocations_from_value(
    value: &Value,
    inherited_timestamp: Option<&str>,
    results: &mut Vec<(String, Option<String>)>,
) {
    match value {
        Value::Object(map) => {
            let current_timestamp = extract_timestamp(map).or(inherited_timestamp);

            if let Some(skill_name) = extract_skill_invocation_from_object(map) {
                results.push((skill_name, current_timestamp.map(str::to_string)));
                return;
            }

            for field_value in map.values() {
                collect_skill_invocations_from_value(field_value, current_timestamp, results);
            }
        }
        Value::Array(items) => {
            for item in items {
                collect_skill_invocations_from_value(item, inherited_timestamp, results);
            }
        }
        Value::String(text) => {
            for skill_name in parse_skill_names_from_text(text) {
                results.push((skill_name, inherited_timestamp.map(str::to_string)));
            }
        }
        _ => {}
    }
}

fn extract_skill_invocation_from_object(map: &Map<String, Value>) -> Option<String> {
    for key in ["functionCall", "function_call"] {
        if let Some(function_call) = map.get(key).and_then(|value| value.as_object()) {
            if let Some(skill_name) = extract_tool_call_skill(function_call) {
                return Some(skill_name);
            }
        }
    }

    extract_tool_call_skill(map)
}

fn extract_tool_call_skill(map: &Map<String, Value>) -> Option<String> {
    let tool_name = map
        .get("name")
        .and_then(|value| value.as_str())
        .or_else(|| map.get("toolName").and_then(|value| value.as_str()))
        .or_else(|| map.get("tool_name").and_then(|value| value.as_str()));

    if !matches!(tool_name, Some("activate_skill" | "skill")) {
        return None;
    }

    for key in ["args", "arguments", "input", "parameters", "payload"] {
        if let Some(value) = map.get(key) {
            if let Some(skill_name) = extract_skill_name_from_argument_value(value) {
                return Some(skill_name);
            }
        }
    }

    None
}

fn extract_skill_name_from_argument_value(value: &Value) -> Option<String> {
    match value {
        Value::String(text) => {
            if let Ok(parsed) = serde_json::from_str::<Value>(text) {
                return extract_skill_name_from_argument_value(&parsed);
            }

            normalize_skill_identifier(text)
        }
        Value::Object(map) => {
            for key in ["skillName", "skill_name", "identifier", "name", "path", "id"] {
                if let Some(value) = map.get(key) {
                    if let Some(skill_name) = extract_skill_name_from_argument_value(value) {
                        return Some(skill_name);
                    }
                }
            }

            for value in map.values() {
                if let Some(skill_name) = extract_skill_name_from_argument_value(value) {
                    return Some(skill_name);
                }
            }

            None
        }
        Value::Array(items) => items
            .iter()
            .find_map(extract_skill_name_from_argument_value),
        _ => None,
    }
}

fn parse_skill_names_from_text(text: &str) -> Vec<String> {
    let mut names = parse_launching_skill_names(text);
    if names.is_empty() {
        if let Some(name) = extract_skill_name_from_cmd(text) {
            names.push(name);
        }
    }
    names
}

fn normalize_skill_identifier(raw: &str) -> Option<String> {
    let trimmed = raw.trim().trim_matches('"').trim_matches('\'');
    if trimmed.is_empty() {
        return None;
    }

    if let Some(skill_name) = extract_skill_name_from_cmd(trimmed) {
        return Some(skill_name);
    }

    let normalized = trimmed.replace('\\', "/");
    let candidate = normalized.rsplit('/').next().unwrap_or(trimmed);
    if candidate.is_empty() || candidate.starts_with('.') {
        return None;
    }

    if candidate
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.'))
    {
        return Some(candidate.to_lowercase());
    }

    None
}

fn extract_timestamp(map: &Map<String, Value>) -> Option<&str> {
    for key in ["timestamp", "createdAt", "updatedAt", "time"] {
        if let Some(value) = map.get(key).and_then(|value| value.as_str()) {
            return Some(value);
        }
    }

    None
}

fn file_timestamp(path: &Path) -> Option<String> {
    let modified = fs::metadata(path).ok()?.modified().ok()?;
    let timestamp = OffsetDateTime::from(modified).format(&Rfc3339).ok()?;
    Some(timestamp)
}

// ─── helpers ──────────────────────────────────────────────────────────────────

fn is_jsonl(path: &Path) -> bool {
    path.extension().and_then(|e| e.to_str()) == Some("jsonl")
}

fn is_json(path: &Path) -> bool {
    path.extension().and_then(|e| e.to_str()) == Some("json")
}

/// 从任意包含 `/path/to/<skill-name>/SKILL.md` 的字符串中提取 skill 名
fn extract_skill_name_from_cmd(cmd: &str) -> Option<String> {
    let normalized = cmd.replace('\\', "/");
    let pos = normalized.find("/SKILL.md")?;
    let before = &normalized[..pos];
    let name = before.split('/').last()?;
    if name.is_empty() || name.starts_with('.') {
        return None;
    }
    Some(name.to_lowercase())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;
    use tempfile::tempdir;

    fn normalize_paths(paths: &[PathBuf]) -> Vec<String> {
        paths.iter()
            .map(|path| path.to_string_lossy().replace('\\', "/"))
            .collect()
    }

    #[test]
    fn extracts_skill_names_from_mixed_json_shapes() {
        let value = serde_json::json!([
            {
                "toolName": "activate_skill",
                "args": {
                    "skillName": "Gemini-Reviewer"
                },
                "timestamp": "2026-04-21T10:00:00Z"
            },
            {
                "functionCall": {
                    "name": "skill",
                    "arguments": {
                        "identifier": "superpowers/brainstorming"
                    }
                },
                "createdAt": "2026-04-21T11:00:00Z"
            },
            {
                "content": "Launching skill: find-skills"
            },
            {
                "content": "/Users/lick/.gemini/skills/code-review/SKILL.md"
            }
        ]);

        let mut results = Vec::new();
        collect_skill_invocations_from_value(&value, None, &mut results);

        let names: Vec<_> = results.into_iter().map(|(name, _)| name).collect();
        assert_eq!(
            names,
            vec![
                "gemini-reviewer".to_string(),
                "brainstorming".to_string(),
                "find-skills".to_string(),
                "code-review".to_string()
            ]
        );
    }

    #[test]
    fn scans_gemini_and_opencode_local_records() {
        let temp = tempdir().unwrap();
        let home = temp.path();

        let gemini_chat = home
            .join(".gemini/tmp/project-a/chats/session-1.json");
        fs::create_dir_all(gemini_chat.parent().unwrap()).unwrap();
        fs::write(
            &gemini_chat,
            serde_json::json!({
                "messages": [
                    {
                        "toolName": "activate_skill",
                        "args": { "skillName": "gemini-reviewer" },
                        "timestamp": "2026-04-21T10:00:00Z"
                    }
                ]
            })
            .to_string(),
        )
        .unwrap();

        let opencode_message = home
            .join("Library/Application Support/opencode/storage/message/session-1/message-1.json");
        fs::create_dir_all(opencode_message.parent().unwrap()).unwrap();
        fs::write(
            &opencode_message,
            serde_json::json!({
                "functionCall": {
                    "name": "skill",
                    "input": { "identifier": "superpowers/brainstorming" }
                },
                "createdAt": "2026-04-21T11:00:00Z"
            })
            .to_string(),
        )
        .unwrap();

        let usage = scan_skill_usage_in_roots(
            &UsageRoots::from_env(
                OsKind::Macos,
                &UsageEnv {
                    home: Some(home.to_path_buf()),
                    ..UsageEnv::default()
                },
            )
            .unwrap(),
        );

        assert_eq!(usage.get("gemini-reviewer").map(|item| item.call_count), Some(1));
        assert_eq!(
            usage.get("gemini-reviewer").and_then(|item| item.last_called_at.clone()),
            Some("2026-04-21T10:00:00Z".into())
        );

        assert_eq!(usage.get("brainstorming").map(|item| item.call_count), Some(1));
        assert_eq!(
            usage.get("brainstorming").and_then(|item| item.last_called_at.clone()),
            Some("2026-04-21T11:00:00Z".into())
        );
    }

    #[test]
    fn resolves_macos_usage_paths() {
        let env = UsageEnv {
            home: Some(PathBuf::from("/Users/demo")),
            ..UsageEnv::default()
        };

        let roots = UsageRoots::from_env(OsKind::Macos, &env).unwrap();

        assert_eq!(
            normalize_paths(&roots.claude_project_dirs),
            vec!["/Users/demo/.claude/projects".to_string()]
        );
        assert_eq!(
            normalize_paths(&roots.codex_session_dirs),
            vec!["/Users/demo/.codex/sessions".to_string()]
        );
        assert_eq!(
            normalize_paths(&roots.gemini_session_dirs),
            vec!["/Users/demo/.gemini/tmp".to_string()]
        );
        assert_eq!(
            normalize_paths(&roots.opencode_message_dirs),
            vec![
                "/Users/demo/Library/Application Support/opencode/storage/message".to_string(),
                "/Users/demo/.opencode/storage/message".to_string(),
            ]
        );
    }

    #[test]
    fn resolves_linux_usage_paths_with_xdg_fallbacks() {
        let env = UsageEnv {
            home: Some(PathBuf::from("/home/demo")),
            ..UsageEnv::default()
        };

        let roots = UsageRoots::from_env(OsKind::Linux, &env).unwrap();

        assert_eq!(
            normalize_paths(&roots.opencode_message_dirs),
            vec![
                "/home/demo/.local/share/opencode/storage/message".to_string(),
                "/home/demo/.local/state/opencode/storage/message".to_string(),
                "/home/demo/.config/opencode/storage/message".to_string(),
                "/home/demo/.opencode/storage/message".to_string(),
            ]
        );
    }

    #[test]
    fn resolves_windows_usage_paths_from_appdata() {
        let env = UsageEnv {
            user_profile: Some(PathBuf::from(r"C:\Users\demo")),
            app_data: Some(PathBuf::from(r"C:\Users\demo\AppData\Roaming")),
            local_app_data: Some(PathBuf::from(r"C:\Users\demo\AppData\Local")),
            ..UsageEnv::default()
        };

        let roots = UsageRoots::from_env(OsKind::Windows, &env).unwrap();

        assert_eq!(
            normalize_paths(&roots.claude_project_dirs),
            vec![r"C:/Users/demo/.claude/projects".to_string()]
        );
        assert_eq!(
            normalize_paths(&roots.codex_session_dirs),
            vec![r"C:/Users/demo/.codex/sessions".to_string()]
        );
        assert_eq!(
            normalize_paths(&roots.gemini_session_dirs),
            vec![r"C:/Users/demo/.gemini/tmp".to_string()]
        );
        assert_eq!(
            normalize_paths(&roots.opencode_message_dirs),
            vec![
                r"C:/Users/demo/AppData/Roaming/opencode/storage/message".to_string(),
                r"C:/Users/demo/AppData/Roaming/OpenCode/storage/message".to_string(),
                r"C:/Users/demo/AppData/Local/opencode/storage/message".to_string(),
                r"C:/Users/demo/AppData/Local/OpenCode/storage/message".to_string(),
                r"C:/Users/demo/.opencode/storage/message".to_string(),
            ]
        );
    }

    #[test]
    fn extracts_skill_name_from_skill_md_path() {
        let cmd = "sed -n '1,220p' /Users/lick/.codex/skills/find-skills/SKILL.md";
        assert_eq!(extract_skill_name_from_cmd(cmd), Some("find-skills".into()));
    }

    #[test]
    fn normalizes_skill_identifier_from_namespaced_value() {
        assert_eq!(
            normalize_skill_identifier("superpowers/brainstorming"),
            Some("brainstorming".into())
        );
    }

    #[test]
    fn ignores_invalid_skill_identifier_text() {
        assert_eq!(normalize_skill_identifier("hello world"), None);
    }

    #[test]
    fn deduplicates_codex_usage_within_single_session() {
        let temp = tempdir().unwrap();
        let session = temp.path().join("2026/04/21/session.jsonl");
        fs::create_dir_all(session.parent().unwrap()).unwrap();
        fs::write(
            &session,
            [
                serde_json::json!({
                    "type": "response_item",
                    "timestamp": "2026-04-21T09:00:00Z",
                    "payload": {
                        "type": "function_call",
                        "name": "exec_command",
                        "arguments": "{\"cmd\":\"sed -n '1,220p' /Users/lick/.codex/skills/find-skills/SKILL.md\"}"
                    }
                })
                .to_string(),
                serde_json::json!({
                    "type": "response_item",
                    "timestamp": "2026-04-21T09:05:00Z",
                    "payload": {
                        "type": "function_call",
                        "name": "exec_command",
                        "arguments": "{\"cmd\":\"sed -n '1,220p' /Users/lick/.codex/skills/find-skills/SKILL.md\"}"
                    }
                })
                .to_string(),
            ]
            .join("\n"),
        )
        .unwrap();

        let mut invocations = HashMap::new();
        parse_codex_jsonl(&session, &mut invocations);

        assert_eq!(
            invocations.get("find-skills"),
            Some(&vec!["2026-04-21T09:00:00Z".into()])
        );
    }

    #[test]
    fn parses_multiple_claude_launch_entries() {
        let names = parse_launching_skill_names(
            "Launching skill: find-skills\nLaunching skill: code-review",
        );
        assert_eq!(names, vec!["find-skills".to_string(), "code-review".to_string()]);
    }

    #[test]
    fn uses_file_timestamp_when_record_has_no_embedded_time() {
        let temp = tempdir().unwrap();
        let file = temp.path().join("record.json");
        fs::write(
            &file,
            serde_json::json!({
                "toolName": "activate_skill",
                "args": { "skillName": "reviewer" }
            })
            .to_string(),
        )
        .unwrap();

        let mut invocations = HashMap::new();
        parse_generic_json_file(&file, &mut invocations);

        assert_eq!(invocations.get("reviewer").map(Vec::len), Some(1));
        assert!(invocations
            .get("reviewer")
            .and_then(|entries| entries.first())
            .is_some_and(|timestamp| !timestamp.is_empty()));
    }

    #[test]
    fn skips_duplicate_json_string_and_nested_fields_for_same_tool_call() {
        let value = serde_json::json!({
            "functionCall": {
                "name": "skill",
                "arguments": "{\"identifier\":\"superpowers/brainstorming\"}"
            }
        });

        let mut results = Vec::new();
        collect_skill_invocations_from_value(&value, None, &mut results);

        assert_eq!(results, vec![("brainstorming".to_string(), None)]);
    }

    #[test]
    fn opencode_scanner_supports_nested_message_directories() {
        let temp = tempdir().unwrap();
        let root = temp.path().join("storage/message/session-1");
        fs::create_dir_all(&root).unwrap();
        fs::write(
            root.join("message-1.json"),
            serde_json::json!({
                "name": "skill",
                "payload": {
                    "identifier": "workspace/release-audit"
                },
                "updatedAt": "2026-04-21T12:00:00Z"
            })
            .to_string(),
        )
        .unwrap();

        let mut invocations = HashMap::new();
        scan_opencode_messages(&temp.path().join("storage/message"), &mut invocations);

        assert_eq!(
            invocations.get("release-audit"),
            Some(&vec!["2026-04-21T12:00:00Z".into()])
        );
    }

    #[test]
    fn scan_json_files_in_named_dirs_only_reads_target_chat_dirs() {
        let temp = tempdir().unwrap();
        let other = temp.path().join("project-a/cache");
        fs::create_dir_all(&other).unwrap();
        fs::write(
            other.join("record.json"),
            serde_json::json!({
                "toolName": "activate_skill",
                "args": { "skillName": "should-not-count" }
            })
            .to_string(),
        )
        .unwrap();

        let chats = temp.path().join("project-a/chats");
        fs::create_dir_all(&chats).unwrap();
        fs::write(
            chats.join("session.json"),
            serde_json::json!({
                "toolName": "activate_skill",
                "args": { "skillName": "should-count" }
            })
            .to_string(),
        )
        .unwrap();

        let mut invocations = HashMap::new();
        scan_json_files_in_named_dirs(temp.path(), "chats", &mut invocations);

        assert_eq!(invocations.get("should-count").map(Vec::len), Some(1));
        assert!(!invocations.contains_key("should-not-count"));
    }

    #[test]
    fn ignores_duplicate_skill_names_within_same_json_record_object() {
        let value = serde_json::json!({
            "content": "Launching skill: reviewer",
            "timestamp": "2026-04-21T13:00:00Z"
        });

        let mut results = Vec::new();
        collect_skill_invocations_from_value(&value, None, &mut results);

        assert_eq!(results, vec![("reviewer".to_string(), Some("2026-04-21T13:00:00Z".into()))]);
    }

    #[test]
    fn normalizes_skill_names_to_lowercase() {
        let mut seen = HashSet::new();
        for name in parse_launching_skill_names("Launching skill: Review-Helper") {
            seen.insert(name);
        }

        assert!(seen.contains("review-helper"));
    }
}
