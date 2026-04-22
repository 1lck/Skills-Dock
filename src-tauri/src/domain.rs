use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ToolKind {
    Codex,
    Claude,
    Gemini,
    Opencode,
    Generic,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceInput {
    pub id: String,
    pub name: String,
    pub tool_kind: ToolKind,
    pub source_type: String,
    pub root_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceRecord {
    pub id: String,
    pub name: String,
    pub tool_kind: ToolKind,
    pub source_type: String,
    pub root_path: String,
    pub status: String,
    pub last_indexed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationIssue {
    pub code: String,
    pub message: String,
    pub severity: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillDetail {
    pub id: String,
    pub name: String,
    pub tool_kind: ToolKind,
    pub source_id: String,
    pub source_path: String,
    pub skill_path: String,
    pub skill_file_path: String,
    pub detected_format: String,
    pub compatibility: String,
    pub status: String,
    pub path_kind: String,
    pub issues: Vec<ValidationIssue>,
    pub preview: String,
    pub updated_at: String,
    pub content: String,
    pub content_hash: String,
    pub related_files: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub source: SourceRecord,
    pub skills: Vec<SkillDetail>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillSnapshot {
    pub sources: Vec<SourceRecord>,
    pub skills: Vec<SkillDetail>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToggleAppInstallRequest {
    pub skill_id: String,
    pub source_skill_path: String,
    pub target_app: ToolKind,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZipSkillEntry {
    pub skill_id: String,
    pub source_skill_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSkillsZipRequest {
    pub zip_path: String,
    pub target_root: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSkillsZipResult {
    pub target_root: String,
    pub imported_skill_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportSkillsZipRequest {
    pub output_path: String,
    pub skills: Vec<ZipSkillEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportSkillsZipResult {
    pub output_path: String,
    pub exported_skill_count: usize,
}
