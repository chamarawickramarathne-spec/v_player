use crate::{AppSettings, AppState};
use std::fs;
use std::path::PathBuf;
use tauri::State;

fn get_data_dir() -> PathBuf {
    let home = dirs_next::home_dir().unwrap_or_else(|| PathBuf::from("."));
    home.join(".vplayer")
}

fn get_settings_path() -> PathBuf {
    get_data_dir().join("settings.json")
}

pub fn load_settings_from_disk() -> Result<AppSettings, String> {
    let path = get_settings_path();
    if !path.exists() {
        return Ok(AppSettings::default());
    }
    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

fn save_settings_to_disk(settings: &AppSettings) -> Result<(), String> {
    let dir = get_data_dir();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let data = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(get_settings_path(), data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

#[tauri::command]
pub fn update_settings(
    state: State<'_, AppState>,
    new_settings: AppSettings,
) -> Result<AppSettings, String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    *settings = new_settings.clone();
    let _ = save_settings_to_disk(&settings);
    Ok(new_settings)
}
