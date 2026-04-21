use std::collections::HashMap;
use std::env;
use std::ffi::OsStr;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, Manager, Runtime};
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

const PROMPT_VERSION: &str = "v1";

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum SummaryProvider {
    Codex,
    Claude,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SummaryStatus {
    Idle,
    Running,
    Complete,
    Error,
    Unavailable,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SummaryRequest {
    pub skill_name: String,
    pub content_hash: String,
    pub content: String,
    pub provider: Option<SummaryProvider>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SummaryResult {
    pub title_zh: String,
    pub summary_zh: String,
    pub translated_markdown_zh: String,
    pub generated_at: String,
    pub provider: SummaryProvider,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SummarySnapshot {
    pub status: SummaryStatus,
    pub available_providers: Vec<SummaryProvider>,
    pub provider: Option<SummaryProvider>,
    pub result: Option<SummaryResult>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SummaryCacheRecord {
    prompt_version: String,
    content_hash: String,
    result: SummaryResult,
}

#[derive(Debug, Clone)]
struct TaskRecord {
    provider: SummaryProvider,
    status: SummaryStatus,
    error: Option<String>,
}

#[derive(Clone, Default)]
pub struct SummaryState {
    tasks: Arc<Mutex<HashMap<String, TaskRecord>>>,
}

impl SummaryState {
    pub fn status<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        request: &SummaryRequest,
    ) -> Result<SummarySnapshot, String> {
        let available_providers = detect_available_providers();
        if let Some(provider) = request.provider {
            if !available_providers.contains(&provider) {
                return Ok(SummarySnapshot {
                    status: SummaryStatus::Unavailable,
                    available_providers,
                    provider: Some(provider),
                    result: None,
                    error: Some(format!("未检测到 {} CLI。", provider_display_name(provider))),
                });
            }

            if let Some(result) = read_cache(app, provider, &request.content_hash)? {
                return Ok(SummarySnapshot {
                    status: SummaryStatus::Complete,
                    available_providers,
                    provider: Some(provider),
                    result: Some(result),
                    error: None,
                });
            }

            let tasks = self.tasks.lock().map_err(|_| "summary tasks lock poisoned".to_string())?;
            if let Some(task) = tasks.get(&task_key(provider, &request.content_hash)) {
                return Ok(SummarySnapshot {
                    status: task.status.clone(),
                    available_providers,
                    provider: Some(task.provider),
                    result: None,
                    error: task.error.clone(),
                });
            }

            return Ok(SummarySnapshot {
                status: SummaryStatus::Idle,
                available_providers,
                provider: Some(provider),
                result: None,
                error: None,
            });
        }

        if let Some((provider, result)) = self.cached_result(app, request)? {
            return Ok(SummarySnapshot {
                status: SummaryStatus::Complete,
                available_providers,
                provider: Some(provider),
                result: Some(result),
                error: None,
            });
        }

        let tasks = self.tasks.lock().map_err(|_| "summary tasks lock poisoned".to_string())?;
        for provider in provider_priority() {
            if let Some(task) = tasks.get(&task_key(provider, &request.content_hash)) {
                return Ok(SummarySnapshot {
                    status: task.status.clone(),
                    available_providers,
                    provider: Some(task.provider),
                    result: None,
                    error: task.error.clone(),
                });
            }
        }

        let preferred = preferred_provider(&available_providers);
        Ok(SummarySnapshot {
            status: if available_providers.is_empty() {
                SummaryStatus::Unavailable
            } else {
                SummaryStatus::Idle
            },
            available_providers,
            provider: preferred,
            result: None,
            error: None,
        })
    }

    pub fn enqueue<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        request: SummaryRequest,
    ) -> Result<SummarySnapshot, String> {
        let available_providers = detect_available_providers();
        let Some(provider) = request
            .provider
            .or_else(|| preferred_provider(&available_providers))
        else {
            return Ok(SummarySnapshot {
                status: SummaryStatus::Unavailable,
                available_providers,
                provider: None,
                result: None,
                error: Some("未检测到可用于生成中文摘要的本机 CLI。".into()),
            });
        };
        if !available_providers.contains(&provider) {
            return Ok(SummarySnapshot {
                status: SummaryStatus::Unavailable,
                available_providers,
                provider: Some(provider),
                result: None,
                error: Some(format!("未检测到 {} CLI。", provider_display_name(provider))),
            });
        }

        if let Some(result) = read_cache(app, provider, &request.content_hash)? {
            return Ok(SummarySnapshot {
                status: SummaryStatus::Complete,
                available_providers,
                provider: Some(provider),
                result: Some(result),
                error: None,
            });
        }

        let key = task_key(provider, &request.content_hash);
        let cache_dir = summary_cache_dir(app)?;
        let work_root = summary_work_root(app)?;
        {
            let mut tasks = self.tasks.lock().map_err(|_| "summary tasks lock poisoned".to_string())?;
            if tasks
                .get(&key)
                .is_some_and(|task| task.status == SummaryStatus::Running)
            {
                return Ok(SummarySnapshot {
                    status: SummaryStatus::Running,
                    available_providers,
                    provider: Some(provider),
                    result: None,
                    error: None,
                });
            }

            tasks.insert(
                key.clone(),
                TaskRecord {
                    provider,
                    status: SummaryStatus::Running,
                    error: None,
                },
            );
        }

        let tasks = Arc::clone(&self.tasks);
        std::thread::spawn(move || {
            let outcome = generate_summary(&work_root, provider, &request);
            if let Ok(mut map) = tasks.lock() {
                match outcome {
                    Ok(result) => {
                        match write_cache(&cache_dir, provider, &request.content_hash, &result) {
                            Ok(()) => {
                                map.remove(&key);
                            }
                            Err(error) => {
                                map.insert(
                                    key,
                                    TaskRecord {
                                        provider,
                                        status: SummaryStatus::Error,
                                        error: Some(error),
                                    },
                                );
                            }
                        }
                    }
                    Err(error) => {
                        map.insert(
                            key,
                            TaskRecord {
                                provider,
                                status: SummaryStatus::Error,
                                error: Some(error),
                            },
                        );
                    }
                }
            }
        });

        Ok(SummarySnapshot {
            status: SummaryStatus::Running,
            available_providers,
            provider: Some(provider),
            result: None,
            error: None,
        })
    }

    fn cached_result<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        request: &SummaryRequest,
    ) -> Result<Option<(SummaryProvider, SummaryResult)>, String> {
        for provider in provider_priority() {
            if let Some(result) = read_cache(app, provider, &request.content_hash)? {
                return Ok(Some((provider, result)));
            }
        }

        Ok(None)
    }
}

pub fn get_summary_status<R: Runtime>(
    app: &AppHandle<R>,
    state: &SummaryState,
    request: &SummaryRequest,
) -> Result<SummarySnapshot, String> {
    state.status(app, request)
}

pub fn enqueue_summary<R: Runtime>(
    app: &AppHandle<R>,
    state: &SummaryState,
    request: SummaryRequest,
) -> Result<SummarySnapshot, String> {
    state.enqueue(app, request)
}

fn generate_summary(
    work_root: &Path,
    provider: SummaryProvider,
    request: &SummaryRequest,
) -> Result<SummaryResult, String> {
    let work_dir = create_work_dir(work_root)?;
    let prompt = build_summary_prompt(request);
    let raw = match provider {
        SummaryProvider::Codex => run_codex(&work_dir, &prompt)?,
        SummaryProvider::Claude => run_claude(&work_dir, &prompt)?,
    };
    let parsed = parse_summary_response(&raw)?;
    let _ = fs::remove_dir_all(&work_dir);

    Ok(SummaryResult {
        title_zh: parsed.title_zh,
        summary_zh: parsed.summary_zh,
        translated_markdown_zh: parsed.translated_markdown_zh,
        generated_at: now_iso(),
        provider,
    })
}

fn build_summary_prompt(request: &SummaryRequest) -> String {
    format!(
        "你是 Skills Dock 的本地翻译助手。请仅基于提供的 Skill Markdown 生成简体中文结果。\n\
输出必须是 JSON，对应字段：titleZh、summaryZh、translatedMarkdownZh。\n\
要求：\n\
- titleZh: 中文标题，简洁自然\n\
- summaryZh: 2 到 4 句中文摘要，说明用途和使用方式\n\
- translatedMarkdownZh: 保留 Markdown 结构，将全文翻译成简体中文\n\
- 不要输出代码块，不要添加字段，不要解释\n\n\
Skill 名称：{skill_name}\n\n\
Skill Markdown:\n```markdown\n{content}\n```",
        skill_name = request.skill_name,
        content = request.content
    )
}

fn run_codex(work_dir: &Path, prompt: &str) -> Result<String, String> {
    let schema_path = work_dir.join("schema.json");
    let output_path = work_dir.join("codex-output.json");
    fs::write(&schema_path, summary_schema_json()).map_err(|error| error.to_string())?;

    let mut child = Command::new(provider_binary_name(SummaryProvider::Codex))
        .current_dir(work_dir)
        .arg("exec")
        .arg("--skip-git-repo-check")
        .arg("--sandbox")
        .arg("read-only")
        .arg("--color")
        .arg("never")
        .arg("--ephemeral")
        .arg("--output-schema")
        .arg(&schema_path)
        .arg("-o")
        .arg(&output_path)
        .arg("-")
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("启动 Codex CLI 失败: {error}"))?;

    if let Some(stdin) = child.stdin.as_mut() {
        stdin
            .write_all(prompt.as_bytes())
            .map_err(|error| format!("写入 Codex prompt 失败: {error}"))?;
    }

    let output = child
        .wait_with_output()
        .map_err(|error| format!("等待 Codex CLI 结果失败: {error}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if stderr.is_empty() {
            "Codex CLI 执行失败。".into()
        } else {
            format!("Codex CLI 执行失败: {stderr}")
        });
    }

    fs::read_to_string(output_path).map_err(|error| format!("读取 Codex 结果失败: {error}"))
}

fn run_claude(work_dir: &Path, prompt: &str) -> Result<String, String> {
    let mut child = Command::new(provider_binary_name(SummaryProvider::Claude))
        .current_dir(work_dir)
        .arg("-p")
        .arg("--output-format")
        .arg("json")
        .arg("--json-schema")
        .arg(summary_schema_json())
        .arg("--tools")
        .arg("")
        .arg("--no-session-persistence")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("启动 Claude Code 失败: {error}"))?;

    if let Some(stdin) = child.stdin.as_mut() {
        stdin
            .write_all(prompt.as_bytes())
            .map_err(|error| format!("写入 Claude prompt 失败: {error}"))?;
    }

    let output = child
        .wait_with_output()
        .map_err(|error| format!("等待 Claude Code 结果失败: {error}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if stderr.is_empty() {
            "Claude Code 执行失败。".into()
        } else {
            format!("Claude Code 执行失败: {stderr}")
        });
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

fn summary_schema_json() -> &'static str {
    r#"{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "titleZh": { "type": "string" },
    "summaryZh": { "type": "string" },
    "translatedMarkdownZh": { "type": "string" }
  },
  "required": ["titleZh", "summaryZh", "translatedMarkdownZh"]
}"#
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct ParsedSummary {
    #[serde(rename = "titleZh")]
    title_zh: String,
    #[serde(rename = "summaryZh")]
    summary_zh: String,
    #[serde(rename = "translatedMarkdownZh")]
    translated_markdown_zh: String,
}

fn parse_summary_response(raw: &str) -> Result<ParsedSummary, String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err("CLI 未返回可解析的摘要内容。".into());
    }

    if let Ok(parsed) = serde_json::from_str::<ParsedSummary>(trimmed) {
        return Ok(parsed);
    }

    if let Ok(value) = serde_json::from_str::<Value>(trimmed) {
        if let Some(result) = value.get("result").and_then(Value::as_str) {
            return parse_summary_response(result);
        }
        if let Some(content) = value.get("content").and_then(Value::as_str) {
            return parse_summary_response(content);
        }
    }

    if let Some(unwrapped) = strip_json_fence(trimmed) {
        return parse_summary_response(&unwrapped);
    }

    Err("无法解析 CLI 返回的中文摘要。".into())
}

fn strip_json_fence(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if !trimmed.starts_with("```") {
        return None;
    }

    let mut lines = trimmed.lines();
    let _ = lines.next()?;
    let inner = lines.collect::<Vec<_>>();
    if inner.last().is_some_and(|line| line.trim() == "```") {
        Some(inner[..inner.len() - 1].join("\n"))
    } else {
        None
    }
}

fn write_cache(
    cache_dir: &Path,
    provider: SummaryProvider,
    content_hash: &str,
    result: &SummaryResult,
) -> Result<(), String> {
    fs::create_dir_all(cache_dir).map_err(|error| error.to_string())?;
    let cache_path = cache_dir.join(cache_file_name(provider, content_hash));
    let record = SummaryCacheRecord {
        prompt_version: PROMPT_VERSION.into(),
        content_hash: content_hash.into(),
        result: result.clone(),
    };
    let payload =
        serde_json::to_string_pretty(&record).map_err(|error| format!("序列化摘要缓存失败: {error}"))?;
    fs::write(cache_path, payload).map_err(|error| format!("写入摘要缓存失败: {error}"))
}

fn read_cache<R: Runtime>(
    app: &AppHandle<R>,
    provider: SummaryProvider,
    content_hash: &str,
) -> Result<Option<SummaryResult>, String> {
    let cache_path = summary_cache_dir(app)?.join(cache_file_name(provider, content_hash));
    if !cache_path.exists() {
        return Ok(None);
    }

    let payload = fs::read_to_string(cache_path).map_err(|error| format!("读取摘要缓存失败: {error}"))?;
    let record: SummaryCacheRecord =
        serde_json::from_str(&payload).map_err(|error| format!("解析摘要缓存失败: {error}"))?;
    if record.prompt_version != PROMPT_VERSION || record.content_hash != content_hash {
        return Ok(None);
    }

    Ok(Some(record.result))
}

fn summary_cache_dir<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|path| path.join("ai-summaries"))
        .map_err(|error| format!("无法解析摘要缓存目录: {error}"))
}

fn summary_work_root<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    app.path()
        .app_cache_dir()
        .map(|path| path.join("ai-summary-jobs"))
        .map_err(|error| format!("无法解析摘要任务目录: {error}"))
}

fn create_work_dir(work_root: &Path) -> Result<PathBuf, String> {
    let path = work_root.join(format!("job-{}", timestamp_millis()));
    fs::create_dir_all(&path).map_err(|error| format!("创建摘要任务目录失败: {error}"))?;
    Ok(path)
}

fn cache_file_name(provider: SummaryProvider, content_hash: &str) -> String {
    format!("{}-{content_hash}-{PROMPT_VERSION}.json", provider_slug(provider))
}

fn provider_display_name(provider: SummaryProvider) -> &'static str {
    match provider {
        SummaryProvider::Codex => "Codex",
        SummaryProvider::Claude => "Claude Code",
    }
}

fn task_key(provider: SummaryProvider, content_hash: &str) -> String {
    format!("{}:{content_hash}", provider_slug(provider))
}

fn provider_slug(provider: SummaryProvider) -> &'static str {
    match provider {
        SummaryProvider::Codex => "codex",
        SummaryProvider::Claude => "claude",
    }
}

fn provider_binary_name(provider: SummaryProvider) -> &'static str {
    match provider {
        SummaryProvider::Codex => "codex",
        SummaryProvider::Claude => "claude",
    }
}

fn provider_priority() -> [SummaryProvider; 2] {
    [SummaryProvider::Codex, SummaryProvider::Claude]
}

fn preferred_provider(providers: &[SummaryProvider]) -> Option<SummaryProvider> {
    provider_priority()
        .into_iter()
        .find(|provider| providers.contains(provider))
}

fn detect_available_providers() -> Vec<SummaryProvider> {
    let owned_path = env::var_os("PATH");
    detect_available_providers_in_env(owned_path.as_deref())
}

fn detect_available_providers_in_env(path_override: Option<&OsStr>) -> Vec<SummaryProvider> {
    provider_priority()
        .into_iter()
        .filter(|provider| binary_exists_in_path(provider_binary_name(*provider), path_override))
        .collect()
}

fn binary_exists_in_path(binary_name: &str, path_override: Option<&OsStr>) -> bool {
    let owned_path;
    let path_value = if let Some(path_override) = path_override {
        path_override
    } else {
        owned_path = env::var_os("PATH");
        let Some(value) = owned_path.as_deref() else {
            return false;
        };
        value
    };

    binary_candidates(binary_name).iter().any(|candidate| {
        env::split_paths(path_value)
            .map(|dir| dir.join(candidate))
            .any(|path| path.is_file())
    })
}

fn binary_candidates(binary_name: &str) -> Vec<String> {
    #[cfg(windows)]
    {
        let mut candidates = vec![binary_name.to_string()];
        let pathext = env::var_os("PATHEXT")
            .map(|value| value.to_string_lossy().split(';').map(str::to_string).collect::<Vec<_>>())
            .unwrap_or_else(|| vec![".COM".into(), ".EXE".into(), ".BAT".into(), ".CMD".into()]);

        for ext in pathext {
            let ext = ext.trim();
            if ext.is_empty() {
                continue;
            }

            let normalized = if ext.starts_with('.') {
                ext.to_string()
            } else {
                format!(".{ext}")
            };
            candidates.push(format!("{binary_name}{normalized}"));
        }

        candidates
    }

    #[cfg(not(windows))]
    {
        vec![binary_name.to_string()]
    }
}

fn now_iso() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".into())
}

fn timestamp_millis() -> i128 {
    OffsetDateTime::now_utc().unix_timestamp_nanos() / 1_000_000
}

#[cfg(test)]
mod tests {
    use std::env;
    use std::fs;

    use serde_json::json;
    use tempfile::tempdir;

    use super::*;

    #[test]
    fn parses_claude_wrapped_json_result() {
        let wrapped = json!({
            "type": "result",
            "subtype": "success",
            "result": "{\"titleZh\":\"前端技能\",\"summaryZh\":\"构建现代界面。\",\"translatedMarkdownZh\":\"# 前端技能\\n\\n构建现代界面。\"}"
        });
        let parsed = parse_summary_response(&wrapped.to_string()).unwrap();

        assert_eq!(parsed.title_zh, "前端技能");
        assert_eq!(parsed.summary_zh, "构建现代界面。");
        assert!(parsed.translated_markdown_zh.contains("构建现代界面"));
    }

    #[test]
    fn detects_supported_cli_providers_from_path() {
        let temp = tempdir().unwrap();
        let bin_dir = temp.path().join("bin");
        fs::create_dir_all(&bin_dir).unwrap();

        for binary in [
            provider_binary_name(SummaryProvider::Codex),
            provider_binary_name(SummaryProvider::Claude),
        ] {
            fs::write(bin_dir.join(binary), "").unwrap();
        }

        let path_value = env::join_paths([bin_dir]).unwrap();
        let providers = detect_available_providers_in_env(Some(path_value.as_os_str()));

        assert_eq!(providers, vec![SummaryProvider::Codex, SummaryProvider::Claude]);
    }
}
