use std::{
    env, fs, io,
    path::{Path, PathBuf},
    process::Command,
    time::SystemTime,
};

use sha2::{Digest, Sha256};
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

use crate::domain::{
    ScanResult, SkillDetail, SkillSnapshot, SourceInput, SourceRecord, ToggleAppInstallRequest,
    ToolKind, ValidationIssue,
};

pub fn resolve_builtin_sources(custom_roots: Vec<String>) -> Vec<SourceRecord> {
    let mut sources = vec![
        builtin_source("Codex Skills", ToolKind::Codex, "~/.codex/skills"),
        builtin_source(
            "Codex Superpowers",
            ToolKind::Codex,
            "~/.codex/superpowers/skills",
        ),
        builtin_source("Claude Skills", ToolKind::Claude, "~/.claude/skills"),
        builtin_source("Gemini Skills", ToolKind::Gemini, "~/.gemini/skills"),
        builtin_source("OpenCode Skills", ToolKind::Opencode, "~/.opencode/skills"),
    ];

    sources.extend(custom_roots.into_iter().map(custom_source));
    sources
}

pub fn scan_source(source: &SourceInput) -> io::Result<ScanResult> {
    let root = PathBuf::from(&source.root_path);

    if !root.exists() {
        return Ok(ScanResult {
            source: SourceRecord {
                id: source.id.clone(),
                name: source.name.clone(),
                tool_kind: source.tool_kind.clone(),
                source_type: source.source_type.clone(),
                root_path: source.root_path.clone(),
                status: "missing".into(),
                last_indexed_at: None,
            },
            skills: Vec::new(),
        });
    }

    let mut skill_dirs = Vec::new();
    collect_skill_dirs(&root, &mut skill_dirs)?;

    let mut skills = skill_dirs
        .into_iter()
        .map(|skill_dir| build_skill(source, &root, &skill_dir))
        .collect::<io::Result<Vec<_>>>()?;

    skills.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));

    let status = if skills.is_empty() {
        "empty"
    } else if skills
        .iter()
        .any(|skill| matches!(skill.status.as_str(), "warning" | "invalid"))
    {
        "warning"
    } else {
        "ready"
    };

    Ok(ScanResult {
        source: SourceRecord {
            id: source.id.clone(),
            name: source.name.clone(),
            tool_kind: source.tool_kind.clone(),
            source_type: source.source_type.clone(),
            root_path: source.root_path.clone(),
            status: status.into(),
            last_indexed_at: Some(now_iso()),
        },
        skills,
    })
}

pub fn scan_sources(sources: Vec<SourceInput>) -> io::Result<SkillSnapshot> {
    let mut resolved_sources = Vec::with_capacity(sources.len());
    let mut skills = Vec::new();

    for source in &sources {
        let result = scan_source(source)?;
        resolved_sources.push(result.source);
        skills.extend(result.skills);
    }

    Ok(SkillSnapshot {
        sources: resolved_sources,
        skills,
    })
}

pub fn reveal_path(path: &str) -> io::Result<()> {
    #[cfg(target_os = "macos")]
    {
        let candidate = PathBuf::from(path);
        let mut command = Command::new("open");
        if candidate.is_file() {
            command.arg("-R").arg(candidate);
        } else {
            command.arg(candidate);
        }
        command.status()?;
        return Ok(());
    }

    #[cfg(target_os = "windows")]
    {
        let candidate = PathBuf::from(path);
        let mut command = Command::new("explorer");
        if candidate.is_file() {
            command.arg("/select,").arg(candidate);
        } else {
            command.arg(candidate);
        }
        command.status()?;
        return Ok(());
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        Command::new("xdg-open").arg(path).status()?;
        return Ok(());
    }
}

pub fn toggle_app_install(request: &ToggleAppInstallRequest) -> io::Result<()> {
    toggle_app_install_in_home(request, None)
}

pub fn toggle_app_installs(requests: &[ToggleAppInstallRequest]) -> io::Result<()> {
    toggle_app_installs_in_home(requests, None)
}

fn toggle_app_install_in_home(
    request: &ToggleAppInstallRequest,
    home_override: Option<&Path>,
) -> io::Result<()> {
    let target_root =
        builtin_root_for_app(&request.target_app, home_override).ok_or_else(|| {
            io::Error::new(
                io::ErrorKind::InvalidInput,
                "generic target app is unsupported",
            )
        })?;
    let target_skill_path = Path::new(&target_root).join(&request.skill_id);

    if request.enabled {
        let source_skill_path = PathBuf::from(&request.source_skill_path);
        if !source_skill_path.exists() {
            return Err(io::Error::new(
                io::ErrorKind::NotFound,
                "source skill path does not exist",
            ));
        }

        if target_skill_path.exists() {
            fs::remove_dir_all(&target_skill_path)?;
        }

        copy_dir_recursive(&source_skill_path, &target_skill_path)?;
        return Ok(());
    }

    if target_skill_path.exists() {
        fs::remove_dir_all(target_skill_path)?;
    }

    Ok(())
}

fn toggle_app_installs_in_home(
    requests: &[ToggleAppInstallRequest],
    home_override: Option<&Path>,
) -> io::Result<()> {
    for request in requests {
        toggle_app_install_in_home(request, home_override)?;
    }

    Ok(())
}

fn builtin_source(name: &str, tool_kind: ToolKind, path: &str) -> SourceRecord {
    let root_path = expand_home(path, None);
    let status = classify_source_root(Path::new(&root_path));

    SourceRecord {
        id: make_source_id(&tool_kind, &root_path),
        name: name.into(),
        tool_kind,
        source_type: "builtin".into(),
        root_path,
        status,
        last_indexed_at: None,
    }
}

fn builtin_root_for_app(tool_kind: &ToolKind, home_override: Option<&Path>) -> Option<String> {
    match tool_kind {
        ToolKind::Codex => Some(expand_home("~/.codex/skills", home_override)),
        ToolKind::Claude => Some(expand_home("~/.claude/skills", home_override)),
        ToolKind::Gemini => Some(expand_home("~/.gemini/skills", home_override)),
        ToolKind::Opencode => Some(expand_home("~/.opencode/skills", home_override)),
        ToolKind::Generic => None,
    }
}

fn custom_source(root_path: String) -> SourceRecord {
    let name = Path::new(&root_path)
        .file_name()
        .and_then(|part| part.to_str())
        .filter(|part| !part.is_empty())
        .unwrap_or("Custom Source")
        .to_string();
    let status = classify_source_root(Path::new(&root_path));

    SourceRecord {
        id: make_source_id(&ToolKind::Generic, &root_path),
        name,
        tool_kind: ToolKind::Generic,
        source_type: "custom".into(),
        root_path,
        status,
        last_indexed_at: None,
    }
}

fn classify_source_root(root: &Path) -> String {
    if !root.exists() {
        return "missing".into();
    }

    if root.is_dir() {
        "ready".into()
    } else {
        "unavailable".into()
    }
}

fn collect_skill_dirs(root: &Path, output: &mut Vec<PathBuf>) -> io::Result<()> {
    if root.join("SKILL.md").is_file() {
        output.push(root.to_path_buf());
        return Ok(());
    }

    for entry in fs::read_dir(root)? {
        let entry = entry?;
        if points_to_directory(&entry.path())? {
            collect_skill_dirs(&entry.path(), output)?;
        }
    }

    Ok(())
}

fn build_skill(source: &SourceInput, root: &Path, skill_dir: &Path) -> io::Result<SkillDetail> {
    let skill_file_path = skill_dir.join("SKILL.md");
    let content = fs::read_to_string(&skill_file_path)?;
    let title = extract_title(&content);
    let issues = validate_skill(&content, title.is_some());
    let relative_path = skill_dir
        .strip_prefix(root)
        .unwrap_or(skill_dir)
        .to_string_lossy()
        .replace('\\', "/");
    let updated_at = fs::metadata(&skill_file_path)
        .and_then(|metadata| metadata.modified())
        .map(system_time_to_iso)
        .unwrap_or_else(|_| now_iso());
    let content_hash = hash_content(&content);
    let compatibility = match source.tool_kind {
        ToolKind::Generic => "unknown".into(),
        ToolKind::Codex => "codex".into(),
        ToolKind::Claude => "claude".into(),
        ToolKind::Gemini => "gemini".into(),
        ToolKind::Opencode => "opencode".into(),
    };

    Ok(SkillDetail {
        id: format!("{}::{}", source.id, relative_path.to_lowercase()),
        name: title.unwrap_or_else(|| {
            skill_dir
                .file_name()
                .and_then(|segment| segment.to_str())
                .unwrap_or("Untitled Skill")
                .to_string()
        }),
        tool_kind: source.tool_kind.clone(),
        source_id: source.id.clone(),
        source_path: source.root_path.clone(),
        skill_path: skill_dir.display().to_string(),
        skill_file_path: skill_file_path.display().to_string(),
        detected_format: "skill-md".into(),
        compatibility,
        status: derive_status(&issues).into(),
        path_kind: path_kind_for_skill_dir(skill_dir).into(),
        issues,
        preview: make_preview(&content),
        updated_at,
        content,
        content_hash,
        related_files: collect_related_files(skill_dir, &skill_file_path)?,
    })
}

fn path_kind_for_skill_dir(skill_dir: &Path) -> &'static str {
    if fs::symlink_metadata(skill_dir)
        .map(|metadata| metadata.file_type().is_symlink())
        .unwrap_or(false)
    {
        "symlink"
    } else {
        "directory"
    }
}

fn validate_skill(content: &str, has_title: bool) -> Vec<ValidationIssue> {
    let mut issues = Vec::new();

    if !has_title {
        issues.push(ValidationIssue {
            code: "missing-title".into(),
            message: "No markdown heading or frontmatter name was found.".into(),
            severity: "warning".into(),
        });
    }

    if content.trim().is_empty() {
        issues.push(ValidationIssue {
            code: "empty-skill-file".into(),
            message: "SKILL.md is empty.".into(),
            severity: "error".into(),
        });
    }

    issues
}

fn derive_status(issues: &[ValidationIssue]) -> &'static str {
    if issues.iter().any(|issue| issue.severity == "error") {
        return "invalid";
    }

    if issues.is_empty() {
        "valid"
    } else {
        "warning"
    }
}

fn extract_title(content: &str) -> Option<String> {
    if let Some(frontmatter_name) = content
        .lines()
        .skip_while(|line| *line != "---")
        .skip(1)
        .take_while(|line| *line != "---")
        .find_map(|line| {
            line.strip_prefix("name:")
                .map(|value| value.trim().to_string())
        })
    {
        if !frontmatter_name.is_empty() {
            return Some(frontmatter_name);
        }
    }

    content
        .lines()
        .find_map(|line| line.strip_prefix("#").map(|value| value.trim().to_string()))
        .filter(|value| !value.is_empty())
}

fn make_preview(content: &str) -> String {
    let stripped = content
        .replace("```", " ")
        .lines()
        .filter(|line| *line != "---" && !line.trim_start().starts_with("name:"))
        .collect::<Vec<_>>()
        .join(" ");

    stripped
        .replace('#', " ")
        .replace('*', " ")
        .split_whitespace()
        .take(24)
        .collect::<Vec<_>>()
        .join(" ")
}

fn collect_related_files(skill_dir: &Path, skill_file_path: &Path) -> io::Result<Vec<String>> {
    let mut related_files = Vec::new();

    for entry in fs::read_dir(skill_dir)? {
        let entry = entry?;
        let path = entry.path();
        if path != skill_file_path && path.is_file() {
            related_files.push(path.display().to_string());
        }
    }

    related_files.sort();
    Ok(related_files)
}

fn points_to_directory(path: &Path) -> io::Result<bool> {
    let file_type = fs::symlink_metadata(path)?.file_type();
    if file_type.is_dir() {
        return Ok(true);
    }

    if file_type.is_symlink() {
        return Ok(fs::metadata(path)
            .map(|metadata| metadata.is_dir())
            .unwrap_or(false));
    }

    Ok(false)
}

fn hash_content(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn copy_dir_recursive(source: &Path, target: &Path) -> io::Result<()> {
    fs::create_dir_all(target)?;

    for entry in fs::read_dir(source)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let next_target = target.join(entry.file_name());
        if file_type.is_dir() {
            copy_dir_recursive(&entry.path(), &next_target)?;
        } else {
            fs::copy(entry.path(), next_target)?;
        }
    }

    Ok(())
}

fn expand_home(path: &str, home_override: Option<&Path>) -> String {
    if !path.starts_with("~/") {
        return path.to_string();
    }

    let home = home_override
        .map(|path| path.display().to_string())
        .unwrap_or_else(|| {
            env::var("HOME")
                .or_else(|_| env::var("USERPROFILE"))
                .unwrap_or_default()
        });

    if home.is_empty() {
        path.replacen("~/", "", 1)
    } else {
        format!("{home}/{}", path.trim_start_matches("~/"))
    }
}

fn make_source_id(tool_kind: &ToolKind, root_path: &str) -> String {
    let prefix = match tool_kind {
        ToolKind::Codex => "codex",
        ToolKind::Claude => "claude",
        ToolKind::Gemini => "gemini",
        ToolKind::Opencode => "opencode",
        ToolKind::Generic => "generic",
    };

    format!("{prefix}::{}", root_path.replace('\\', "/").to_lowercase())
}

fn system_time_to_iso(value: SystemTime) -> String {
    OffsetDateTime::from(value)
        .format(&Rfc3339)
        .unwrap_or_else(|_| now_iso())
}

fn now_iso() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".into())
}

#[cfg(test)]
mod tests {
    use std::fs;

    use tempfile::tempdir;

    use crate::domain::{SourceInput, ToggleAppInstallRequest, ToolKind};

    use super::{
        resolve_builtin_sources, scan_source, toggle_app_install_in_home,
        toggle_app_installs_in_home,
    };

    #[test]
    fn detects_skill_folder_when_skill_md_exists() {
        let temp = tempdir().unwrap();
        let skill_dir = temp.path().join("frontend-skill");
        fs::create_dir_all(&skill_dir).unwrap();
        fs::write(
            skill_dir.join("SKILL.md"),
            "# Frontend Skill\n\nBuild modern interfaces.\n",
        )
        .unwrap();

        let source = SourceInput {
            id: "generic::/tmp/library".into(),
            name: "Custom Library".into(),
            tool_kind: ToolKind::Generic,
            source_type: "custom".into(),
            root_path: temp.path().display().to_string(),
        };

        let result = scan_source(&source).unwrap();

        assert_eq!(result.skills.len(), 1);
        assert_eq!(result.skills[0].name, "Frontend Skill");
        assert_eq!(result.skills[0].status, "valid");
    }

    #[test]
    fn marks_missing_sources_as_unavailable() {
        let temp = tempdir().unwrap();
        let missing_root = temp.path().join("does-not-exist");
        let missing = resolve_builtin_sources(vec![missing_root.display().to_string()])
            .into_iter()
            .find(|source| source.root_path == missing_root.display().to_string())
            .unwrap();

        assert!(matches!(missing.status.as_str(), "missing" | "unavailable"));
    }

    #[test]
    fn marks_markdown_without_title_as_warning() {
        let temp = tempdir().unwrap();
        let skill_dir = temp.path().join("translator");
        fs::create_dir_all(&skill_dir).unwrap();
        fs::write(
            skill_dir.join("SKILL.md"),
            "Translate prompts and instructions.\n",
        )
        .unwrap();

        let source = SourceInput {
            id: "generic::/tmp/library".into(),
            name: "Custom Library".into(),
            tool_kind: ToolKind::Generic,
            source_type: "custom".into(),
            root_path: temp.path().display().to_string(),
        };

        let result = scan_source(&source).unwrap();

        assert_eq!(result.skills[0].status, "warning");
        assert_eq!(result.skills[0].issues[0].code, "missing-title");
    }

    #[test]
    fn enables_app_install_by_copying_skill_directory() {
        let temp = tempdir().unwrap();
        let source_skill = temp.path().join("library").join("error-resolver");
        fs::create_dir_all(&source_skill).unwrap();
        fs::write(source_skill.join("SKILL.md"), "# Error Resolver\n").unwrap();
        fs::write(source_skill.join("notes.txt"), "extra").unwrap();

        toggle_app_install_in_home(
            &ToggleAppInstallRequest {
                skill_id: "error-resolver".into(),
                source_skill_path: source_skill.display().to_string(),
                target_app: ToolKind::Claude,
                enabled: true,
            },
            Some(temp.path()),
        )
        .unwrap();

        let target_skill = temp.path().join(".claude/skills/error-resolver");
        assert!(target_skill.join("SKILL.md").exists());
        assert!(target_skill.join("notes.txt").exists());
    }

    #[test]
    fn disables_app_install_by_removing_target_directory() {
        let temp = tempdir().unwrap();
        let target_skill = temp.path().join(".gemini/skills/error-resolver");
        fs::create_dir_all(&target_skill).unwrap();
        fs::write(target_skill.join("SKILL.md"), "# Error Resolver\n").unwrap();

        toggle_app_install_in_home(
            &ToggleAppInstallRequest {
                skill_id: "error-resolver".into(),
                source_skill_path: temp
                    .path()
                    .join("library/error-resolver")
                    .display()
                    .to_string(),
                target_app: ToolKind::Gemini,
                enabled: false,
            },
            Some(temp.path()),
        )
        .unwrap();

        assert!(!target_skill.exists());
    }

    #[test]
    fn applies_batch_install_requests_in_one_call() {
        let temp = tempdir().unwrap();
        let error_resolver = temp.path().join("library").join("error-resolver");
        let translator = temp.path().join("library").join("translator");
        fs::create_dir_all(&error_resolver).unwrap();
        fs::create_dir_all(&translator).unwrap();
        fs::write(error_resolver.join("SKILL.md"), "# Error Resolver\n").unwrap();
        fs::write(translator.join("SKILL.md"), "# Translator\n").unwrap();

        toggle_app_installs_in_home(
            &[
                ToggleAppInstallRequest {
                    skill_id: "error-resolver".into(),
                    source_skill_path: error_resolver.display().to_string(),
                    target_app: ToolKind::Claude,
                    enabled: true,
                },
                ToggleAppInstallRequest {
                    skill_id: "translator".into(),
                    source_skill_path: translator.display().to_string(),
                    target_app: ToolKind::Codex,
                    enabled: true,
                },
            ],
            Some(temp.path()),
        )
        .unwrap();

        assert!(temp
            .path()
            .join(".claude/skills/error-resolver/SKILL.md")
            .exists());
        assert!(temp
            .path()
            .join(".codex/skills/translator/SKILL.md")
            .exists());
    }

    #[cfg(unix)]
    #[test]
    fn follows_symlinked_skill_directories() {
        use std::os::unix::fs::symlink;

        let temp = tempdir().unwrap();
        let actual_skill = temp.path().join("shared/error-resolver");
        fs::create_dir_all(&actual_skill).unwrap();
        fs::write(actual_skill.join("SKILL.md"), "# Error Resolver\n").unwrap();

        let source_root = temp.path().join("claude-skills");
        fs::create_dir_all(&source_root).unwrap();
        symlink(&actual_skill, source_root.join("error-resolver")).unwrap();

        let source = SourceInput {
            id: "claude::/tmp/claude-skills".into(),
            name: "Claude Skills".into(),
            tool_kind: ToolKind::Claude,
            source_type: "builtin".into(),
            root_path: source_root.display().to_string(),
        };

        let result = scan_source(&source).unwrap();

        assert_eq!(result.skills.len(), 1);
        assert_eq!(result.skills[0].name, "Error Resolver");
    }
}
