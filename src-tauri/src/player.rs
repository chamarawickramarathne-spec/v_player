use serde_json::{json, Value};

#[tauri::command]
pub fn open_file(path: String) -> Result<String, String> {
    Ok(path)
}

#[tauri::command]
pub fn play() -> Result<String, String> {
    Ok("play".to_string())
}

#[tauri::command]
pub fn pause() -> Result<String, String> {
    Ok("pause".to_string())
}

#[tauri::command]
pub fn stop() -> Result<String, String> {
    Ok("stop".to_string())
}

#[tauri::command]
pub fn seek(position: f64) -> Result<String, String> {
    Ok(format!("seek:{}", position))
}

#[tauri::command]
pub fn seek_relative(offset: f64) -> Result<String, String> {
    Ok(format!("seek_relative:{}", offset))
}

#[tauri::command]
pub fn set_volume(level: f64) -> Result<String, String> {
    Ok(format!("volume:{}", level))
}

#[tauri::command]
pub fn toggle_mute() -> Result<String, String> {
    Ok("mute".to_string())
}

#[tauri::command]
pub fn toggle_fullscreen() -> Result<String, String> {
    Ok("fullscreen".to_string())
}

#[tauri::command]
pub fn set_playback_speed(speed: f64) -> Result<String, String> {
    Ok(format!("speed:{}", speed))
}

#[tauri::command]
pub fn take_screenshot(path: String) -> Result<String, String> {
    Ok(format!("screenshot:{}", path))
}

#[tauri::command]
pub fn load_subtitle(path: String) -> Result<String, String> {
    Ok(format!("subtitle:{}", path))
}

#[tauri::command]
pub fn next_frame() -> Result<String, String> {
    Ok("next_frame".to_string())
}

#[tauri::command]
pub fn prev_frame() -> Result<String, String> {
    Ok("prev_frame".to_string())
}

#[tauri::command]
pub fn set_property(name: String, value: String) -> Result<String, String> {
    Ok(format!("property:{}={}", name, value))
}

#[tauri::command]
pub fn get_property(name: String) -> Result<String, String> {
    Ok(format!("get_property:{}", name))
}

#[tauri::command]
pub fn playlist_add(paths: Vec<String>) -> Result<String, String> {
    Ok(json!(paths).to_string())
}

#[tauri::command]
pub fn playlist_next() -> Result<String, String> {
    Ok("playlist_next".to_string())
}

#[tauri::command]
pub fn playlist_prev() -> Result<String, String> {
    Ok("playlist_prev".to_string())
}

#[tauri::command]
pub fn playlist_clear() -> Result<String, String> {
    Ok("playlist_clear".to_string())
}

#[tauri::command]
pub fn playlist_remove(index: usize) -> Result<String, String> {
    Ok(format!("playlist_remove:{}", index))
}

#[tauri::command]
pub fn get_track_list() -> Result<String, String> {
    Ok("[]".to_string())
}

#[tauri::command]
pub fn set_track(track_type: String, index: i32) -> Result<String, String> {
    Ok(format!("set_track:{}:{}", track_type, index))
}

#[tauri::command]
pub fn cycle_subtitles() -> Result<String, String> {
    Ok("cycle_subtitles".to_string())
}
