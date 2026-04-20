mod domain;
mod scan;

use domain::{SkillSnapshot, SourceInput, SourceRecord, ToggleAppInstallRequest};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            load_sources,
            scan_sources,
            open_path,
            toggle_app_install
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
