mod domain;
mod scan;
mod summary;
mod usage;

use domain::{
    ExportSkillsZipRequest, ExportSkillsZipResult, ImportSkillsZipRequest, ImportSkillsZipResult,
    SkillSnapshot, SourceInput, SourceRecord, ToggleAppInstallRequest,
};
use summary::{SummaryRequest, SummarySnapshot, SummaryState};
use std::collections::HashMap;

#[tauri::command]
fn load_sources(custom_roots: Vec<String>) -> Vec<SourceRecord> {
    scan::resolve_builtin_sources(custom_roots)
}

#[tauri::command]
fn scan_sources(sources: Vec<SourceInput>) -> Result<SkillSnapshot, String> {
    scan::scan_sources(sources).map_err(|error| error.to_string())
}

#[tauri::command]
fn open_path(path: String) -> Result<(), String> {
    scan::reveal_path(&path).map_err(|error| error.to_string())
}

#[tauri::command]
fn toggle_app_install(request: ToggleAppInstallRequest) -> Result<(), String> {
    scan::toggle_app_install(&request).map_err(|error| error.to_string())
}

#[tauri::command]
fn toggle_app_installs(requests: Vec<ToggleAppInstallRequest>) -> Result<(), String> {
    scan::toggle_app_installs(&requests).map_err(|error| error.to_string())
}

#[tauri::command]
fn import_skills_zip(request: ImportSkillsZipRequest) -> Result<ImportSkillsZipResult, String> {
    scan::import_skills_zip(&request).map_err(|error| error.to_string())
}

#[tauri::command]
fn export_skills_zip(request: ExportSkillsZipRequest) -> Result<ExportSkillsZipResult, String> {
    scan::export_skills_zip(&request).map_err(|error| error.to_string())
}

#[tauri::command]
fn scan_skill_usage() -> HashMap<String, usage::SkillCallRecord> {
    usage::scan_skill_usage()
}

#[tauri::command]
fn get_installed_apps() -> HashMap<String, bool> {
    scan::check_installed_apps()
}

#[tauri::command]
fn get_skill_ai_summary(
    app: tauri::AppHandle,
    state: tauri::State<SummaryState>,
    request: SummaryRequest,
) -> Result<SummarySnapshot, String> {
    summary::get_summary_status(&app, state.inner(), &request)
}

#[tauri::command]
fn enqueue_skill_ai_summary(
    app: tauri::AppHandle,
    state: tauri::State<SummaryState>,
    request: SummaryRequest,
) -> Result<SummarySnapshot, String> {
    summary::enqueue_summary(&app, state.inner(), request)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(SummaryState::default())
        .invoke_handler(tauri::generate_handler![
            load_sources,
            scan_sources,
            open_path,
            toggle_app_install,
            toggle_app_installs,
            import_skills_zip,
            export_skills_zip,
            scan_skill_usage,
            get_installed_apps,
            get_skill_ai_summary,
            enqueue_skill_ai_summary,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
