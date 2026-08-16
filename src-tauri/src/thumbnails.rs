use std::fs;
use std::path::PathBuf;

fn get_data_dir() -> PathBuf {
    let home = dirs_next::home_dir().unwrap_or_else(|| PathBuf::from("."));
    home.join(".vplayer")
}

fn get_thumbs_dir() -> PathBuf {
    get_data_dir().join("thumbs")
}

fn normalize_path_key(path: &str) -> String {
    path.replace('/', "\\").to_lowercase()
}

fn path_hash(path: &str) -> String {
    let n = normalize_path_key(path);
    let mut h: u64 = 5381;
    for b in n.bytes() {
        h = h.wrapping_mul(33).wrapping_add(u64::from(b));
    }
    format!("{h:016x}")
}

fn thumb_file_for(path: &str) -> PathBuf {
    get_thumbs_dir().join(format!("{}.png", path_hash(path)))
}

pub fn delete_thumb_for_path(path: &str) {
    let p = thumb_file_for(path);
    let _ = fs::remove_file(p);
}

pub fn clear_all_thumbs() {
    let dir = get_thumbs_dir();
    if !dir.exists() {
        return;
    }
    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                let _ = fs::remove_file(p);
            }
        }
    }
}

#[tauri::command]
pub fn get_thumbnail_path(path: String) -> Result<Option<String>, String> {
    let p = thumb_file_for(&path);
    if p.is_file() {
        Ok(Some(p.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn prepare_thumbnail_path(path: String) -> Result<String, String> {
    let dir = get_thumbs_dir();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(thumb_file_for(&path).to_string_lossy().to_string())
}

#[tauri::command]
pub fn delete_thumbnail(path: String) -> Result<(), String> {
    delete_thumb_for_path(&path);
    Ok(())
}
