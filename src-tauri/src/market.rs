use crate::domain::{
    InstallMarketPackageRequest, InstallMarketPackageResult, MarketInstallSkillRequest,
    MarketPackageSnapshotRequest, MarketPackageSnapshotResult, MarketRemoteMemberSnapshot,
};
use reqwest::blocking::Client;
use serde::Deserialize;
use std::fs;
use std::io;
use std::path::{Component, Path, PathBuf};
use tauri::Manager;

const SKILLHUB_API_BASE: &str = "https://api.skillhub.cn/api/v1/skills";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SkillhubSkillDetailResponse {
    latest_version: SkillhubVersion,
    owner: SkillhubOwner,
    skill: SkillhubSkill,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SkillhubVersion {
    version: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SkillhubOwner {
    display_name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SkillhubSkill {
    source: Option<String>,
    updated_at: i64,
    stats: SkillhubSkillStats,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SkillhubSkillStats {
    downloads: u64,
    installs: u64,
    stars: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SkillhubFilesResponse {
    files: Vec<SkillhubFileEntry>,
}

#[derive(Debug, Deserialize)]
struct SkillhubFileEntry {
    path: String,
}

pub fn install_market_package(
    app: &tauri::AppHandle,
    request: &InstallMarketPackageRequest,
) -> Result<InstallMarketPackageResult, String> {
    let target_root = market_root(app).map_err(|error| error.to_string())?;
    fs::create_dir_all(&target_root).map_err(|error| error.to_string())?;

    let client = Client::builder()
        .user_agent("skills-dock/0.1.15")
        .build()
        .map_err(|error| error.to_string())?;

    let mut installed_skill_paths = Vec::with_capacity(request.skills.len());
    for skill in &request.skills {
        let installed_path = install_skillhub_skill(&client, &target_root, skill)
            .map_err(|error| error.to_string())?;
        installed_skill_paths.push(installed_path.display().to_string());
    }

    Ok(InstallMarketPackageResult {
        target_root: target_root.display().to_string(),
        installed_skill_paths,
    })
}

pub fn get_market_package_snapshot(
    request: &MarketPackageSnapshotRequest,
) -> Result<MarketPackageSnapshotResult, String> {
    let client = Client::builder()
        .user_agent("skills-dock/0.1.15")
        .build()
        .map_err(|error| error.to_string())?;

    let mut members = Vec::with_capacity(request.skills.len());
    let mut total_downloads = 0_u64;
    let mut total_installs = 0_u64;
    let mut last_updated_at: Option<i64> = None;

    for skill in &request.skills {
        let detail = fetch_skill_detail(&client, &skill.slug).map_err(|error| error.to_string())?;
        total_downloads = total_downloads.saturating_add(detail.skill.stats.downloads);
        total_installs = total_installs.saturating_add(detail.skill.stats.installs);
        last_updated_at = Some(
            last_updated_at
                .map(|current| current.max(detail.skill.updated_at))
                .unwrap_or(detail.skill.updated_at),
        );

        members.push(MarketRemoteMemberSnapshot {
            slug: skill.slug.clone(),
            version: detail.latest_version.version,
            downloads: detail.skill.stats.downloads,
            installs: detail.skill.stats.installs,
            stars: detail.skill.stats.stars,
            updated_at: Some(detail.skill.updated_at),
            owner_name: Some(detail.owner.display_name),
            source: detail.skill.source,
        });
    }

    Ok(MarketPackageSnapshotResult {
        package_id: request.package_id.clone(),
        total_downloads,
        total_installs,
        member_count: members.len(),
        last_updated_at,
        members,
    })
}

fn install_skillhub_skill(
    client: &Client,
    target_root: &Path,
    skill: &MarketInstallSkillRequest,
) -> io::Result<PathBuf> {
    let version = fetch_latest_version(client, &skill.slug)?;
    let files = fetch_files_index(client, &skill.slug, &version)?;
    if !files.iter().any(|entry| entry.path == "SKILL.md") {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!("skill {} missing SKILL.md", skill.slug),
        ));
    }

    let skill_root = target_root.join(&skill.skill_id);
    if skill_root.exists() {
        fs::remove_dir_all(&skill_root)?;
    }
    fs::create_dir_all(&skill_root)?;

    for file in files {
        let relative_path = sanitize_relative_path(&file.path)?;
        let target_path = skill_root.join(&relative_path);
        if let Some(parent) = target_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let response = client
            .get(format!("{}/{}/file", SKILLHUB_API_BASE, skill.slug))
            .query(&[("path", file.path.as_str()), ("version", version.as_str())])
            .send()
            .map_err(to_io_error)?
            .error_for_status()
            .map_err(to_io_error)?;
        let bytes = response.bytes().map_err(to_io_error)?;
        fs::write(target_path, &bytes)?;
    }

    Ok(skill_root)
}

fn fetch_latest_version(client: &Client, slug: &str) -> io::Result<String> {
    let detail = fetch_skill_detail(client, slug)?;
    Ok(detail.latest_version.version)
}

fn fetch_skill_detail(client: &Client, slug: &str) -> io::Result<SkillhubSkillDetailResponse> {
    let response = client
        .get(format!("{}/{}", SKILLHUB_API_BASE, slug))
        .send()
        .map_err(to_io_error)?
        .error_for_status()
        .map_err(to_io_error)?;
    response
        .json::<SkillhubSkillDetailResponse>()
        .map_err(to_io_error)
}

fn fetch_files_index(
    client: &Client,
    slug: &str,
    version: &str,
) -> io::Result<Vec<SkillhubFileEntry>> {
    let response = client
        .get(format!("{}/{}/files", SKILLHUB_API_BASE, slug))
        .query(&[("version", version)])
        .send()
        .map_err(to_io_error)?
        .error_for_status()
        .map_err(to_io_error)?;
    let files = response
        .json::<SkillhubFilesResponse>()
        .map_err(to_io_error)?;
    Ok(files.files)
}

fn market_root(app: &tauri::AppHandle) -> io::Result<PathBuf> {
    let base = app.path().app_data_dir().map_err(to_io_error)?;
    Ok(base.join("market-skills"))
}

fn sanitize_relative_path(raw: &str) -> io::Result<PathBuf> {
    let path = Path::new(raw);
    let mut sanitized = PathBuf::new();

    for component in path.components() {
        match component {
            Component::Normal(segment) => sanitized.push(segment),
            Component::CurDir => {}
            _ => {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidInput,
                    format!("unsupported market file path: {raw}"),
                ))
            }
        }
    }

    if sanitized.as_os_str().is_empty() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "market file path is empty",
        ));
    }

    Ok(sanitized)
}

fn to_io_error<E: std::fmt::Display>(error: E) -> io::Error {
    io::Error::new(io::ErrorKind::Other, error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn sanitize_relative_path_rejects_parent_segments() {
        let error = sanitize_relative_path("../SKILL.md").unwrap_err();
        assert_eq!(error.kind(), io::ErrorKind::InvalidInput);
    }

    #[test]
    #[ignore = "network dependent"]
    fn downloads_skillhub_skill_from_remote() {
        let temp = tempdir().unwrap();
        let client = Client::builder().user_agent("skills-dock-test").build().unwrap();

        let installed = install_skillhub_skill(
            &client,
            temp.path(),
            &MarketInstallSkillRequest {
                slug: "github".into(),
                skill_id: "github".into(),
            },
        )
        .unwrap();

        assert!(installed.join("SKILL.md").exists());
    }
}
