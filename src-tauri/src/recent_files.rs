use crate::{AppState, RecentFile};
use chrono::Utc;
use std::fs;
use std::path::PathBuf;
use tauri::State;

fn get_data_dir() -> PathBuf {
    let home = dirs_next::home_dir().unwrap_or_else(|| PathBuf::from("."));
    home.join(".vplayer")
}

fn get_recent_path() -> PathBuf {
    get_data_dir().join("recent.json")
}

pub fn load_recent_from_disk() -> Result<Vec<RecentFile>, String> {
    let path = get_recent_path();
    if !path.exists() {
        return Ok(Vec::new());
    }
    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

fn save_recent_to_disk(files: &[RecentFile]) -> Result<(), String> {
    let dir = get_data_dir();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let data = serde_json::to_string_pretty(files).map_err(|e| e.to_string())?;
    fs::write(get_recent_path(), data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_recent_file(
    state: State<'_, AppState>,
    path: String,
    name: String,
    media_type: String,
) -> Result<Vec<RecentFile>, String> {
    let mut files = state.recent_files.lock().map_err(|e| e.to_string())?;

    let (kept_position, kept_duration) = files
        .iter()
        .find(|f| f.path == path)
        .map(|f| (f.position, f.duration))
        .unwrap_or((0.0, 0.0));

    files.retain(|f| f.path != path);

    let file = RecentFile {
        path,
        name,
        last_played: Utc::now().to_rfc3339(),
        position: kept_position,
        duration: kept_duration,
        media_type,
    };

    files.insert(0, file);

    if files.len() > 100 {
        files.truncate(100);
    }

    let _ = save_recent_to_disk(&files);
    Ok(files.clone())
}

#[tauri::command]
pub fn get_recent_files(state: State<'_, AppState>) -> Result<Vec<RecentFile>, String> {
    let files = state.recent_files.lock().map_err(|e| e.to_string())?;
    Ok(files.clone())
}

#[tauri::command]
pub fn remove_recent_file(
    state: State<'_, AppState>,
    path: String,
) -> Result<Vec<RecentFile>, String> {
    let mut files = state.recent_files.lock().map_err(|e| e.to_string())?;
    files.retain(|f| f.path != path);
    crate::thumbnails::delete_thumb_for_path(&path);
    let _ = save_recent_to_disk(&files);
    Ok(files.clone())
}

#[tauri::command]
pub fn clear_recent_files(state: State<'_, AppState>) -> Result<Vec<RecentFile>, String> {
    let mut files = state.recent_files.lock().map_err(|e| e.to_string())?;
    files.clear();
    crate::thumbnails::clear_all_thumbs();
    let _ = save_recent_to_disk(&files);
    Ok(files.clone())
}

#[tauri::command]
pub fn update_position(
    state: State<'_, AppState>,
    path: String,
    position: f64,
    duration: f64,
) -> Result<Vec<RecentFile>, String> {
    let mut files = state.recent_files.lock().map_err(|e| e.to_string())?;
    if let Some(file) = files.iter_mut().find(|f| f.path == path) {
        file.position = position;
        file.duration = duration;
        file.last_played = Utc::now().to_rfc3339();
    }
    let _ = save_recent_to_disk(&files);
    Ok(files.clone())
}
