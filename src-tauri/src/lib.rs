use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::Manager;

mod file_handler;
mod player;
mod recent_files;
mod settings;
mod updater;

pub struct AppState {
    pub recent_files: Mutex<Vec<RecentFile>>,
    pub settings: Mutex<AppSettings>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentFile {
    pub path: String,
    pub name: String,
    pub last_played: String,
    pub position: f64,
    pub duration: f64,
    pub media_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub theme: String,
    pub accent_color: String,
    pub hwdec: String,
    pub volume: f64,
    pub auto_fit_window: bool,
    pub show_always_on_top: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            accent_color: "#6366f1".to_string(),
            hwdec: "auto-safe".to_string(),
            volume: 1.0,
            auto_fit_window: true,
            show_always_on_top: false,
        }
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to V Player.", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState {
        recent_files: Mutex::new(Vec::new()),
        settings: Mutex::new(AppSettings::default()),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_libmpv::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            greet,
            player::open_file,
            player::play,
            player::pause,
            player::stop,
            player::seek,
            player::seek_relative,
            player::set_volume,
            player::toggle_mute,
            player::toggle_fullscreen,
            player::set_playback_speed,
            player::take_screenshot,
            player::load_subtitle,
            player::next_frame,
            player::prev_frame,
            player::set_property,
            player::get_property,
            player::playlist_add,
            player::playlist_next,
            player::playlist_prev,
            player::playlist_clear,
            player::playlist_remove,
            player::get_track_list,
            player::set_track,
            player::cycle_subtitles,
            recent_files::add_recent_file,
            recent_files::get_recent_files,
            recent_files::remove_recent_file,
            recent_files::clear_recent_files,
            recent_files::update_position,
            settings::get_settings,
            settings::update_settings,
            file_handler::get_supported_extensions,
            updater::get_app_version,
            updater::check_for_update,
            updater::download_update,
            updater::install_update,
        ])
        .setup(|app| {
            // Load saved state
            let state: tauri::State<AppState> = app.state();
            let saved_settings = settings::load_settings_from_disk();
            if let Ok(s) = saved_settings {
                *state.settings.lock().unwrap() = s;
            }
            let saved_recents = recent_files::load_recent_from_disk();
            if let Ok(r) = saved_recents {
                *state.recent_files.lock().unwrap() = r;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
