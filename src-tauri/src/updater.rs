use serde::Serialize;
use std::fs::File;
use std::io::{Read, Write};
use std::thread;
use tauri::{AppHandle, Manager};

pub const GITHUB_OWNER: &str = "chamarawickramarathne-spec";
pub const GITHUB_REPO: &str = "v_player";
pub const INSTALLER_ASSET: &str = "VPlayer-Setup-x64.exe";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub current_version: String,
    pub latest_version: String,
    pub has_update: bool,
    pub download_url: Option<String>,
    pub asset_name: Option<String>,
    pub size_bytes: Option<u64>,
    pub release_notes: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProgress {
    pub stage: String,
    pub received: u64,
    pub total: u64,
    pub path: Option<String>,
}

fn releases_latest_url() -> String {
    format!(
        "https://api.github.com/repos/{}/{}/releases/latest",
        GITHUB_OWNER, GITHUB_REPO
    )
}

fn strip_v(tag: &str) -> &str {
    tag.strip_prefix('v').unwrap_or(tag)
}

#[tauri::command]
pub fn get_app_version(app: AppHandle) -> Result<String, String> {
    Ok(app.package_info().version.to_string())
}

#[tauri::command]
pub fn check_for_update(app: AppHandle) -> Result<UpdateInfo, String> {
    let current = app.package_info().version.to_string();

    let resp = ureq::get(&releases_latest_url())
        .set("User-Agent", &format!("VPlayer/{}", current))
        .set("Accept", "application/vnd.github+json")
        .call()
        .map_err(|e| format!("Failed to reach GitHub: {}", e))?;

    let json: serde_json::Value = serde_json::from_str(
        &resp.into_string().map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;

    if let Some(message) = json.get("message").and_then(|m| m.as_str()) {
        return Err(format!("GitHub API error: {}", message));
    }

    let latest = strip_v(json["tag_name"].as_str().unwrap_or("")).to_string();
    let release_notes = json["body"].as_str().unwrap_or("").to_string();

    let assets = json["assets"].as_array().cloned().unwrap_or_default();
    let asset = assets
        .iter()
        .find(|a| a["name"].as_str() == Some(INSTALLER_ASSET))
        .or_else(|| {
            assets.iter().find(|a| {
                a["name"]
                    .as_str()
                    .map(|n| n.ends_with(".exe") && n.to_lowercase().contains("setup"))
                    .unwrap_or(false)
            })
        });

    let (asset_name, download_url, size_bytes) = match asset {
        Some(a) => (
            a["name"].as_str().unwrap_or("").to_string(),
            a["browser_download_url"].as_str().unwrap_or("").to_string(),
            a["size"].as_u64(),
        ),
        None => (String::new(), String::new(), None),
    };

    let has_update = if latest.is_empty() {
        false
    } else {
        let cur = semver::Version::parse(&current).unwrap_or(semver::Version::new(0, 0, 0));
        let lat = semver::Version::parse(&latest).unwrap_or(semver::Version::new(0, 0, 0));
        lat > cur
    };

    Ok(UpdateInfo {
        current_version: current,
        latest_version: latest,
        has_update,
        download_url: if download_url.is_empty() {
            None
        } else {
            Some(download_url)
        },
        asset_name: if asset_name.is_empty() {
            None
        } else {
            Some(asset_name)
        },
        size_bytes,
        release_notes: if release_notes.is_empty() {
            None
        } else {
            Some(release_notes)
        },
    })
}

#[tauri::command]
pub fn download_update(
    app: AppHandle,
    url: String,
    channel: tauri::ipc::Channel<UpdateProgress>,
) -> Result<(), String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("updates");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let tmp_path = dir.join(format!("{}.part", INSTALLER_ASSET));
    let final_path = dir.join(INSTALLER_ASSET);

    thread::spawn(move || -> Result<(), String> {
        let _ = channel.send(UpdateProgress {
            stage: "starting".to_string(),
            received: 0,
            total: 0,
            path: None,
        });

        let resp = ureq::get(&url)
            .set("User-Agent", "VPlayer-Updater")
            .call()
            .map_err(|e| e.to_string())?;

        let total: u64 = resp
            .header("Content-Length")
            .and_then(|v| v.parse().ok())
            .unwrap_or(0);

        let mut reader = resp.into_reader();
        let mut file = File::create(&tmp_path).map_err(|e| e.to_string())?;
        let mut received: u64 = 0;
        let mut buf = [0u8; 64 * 1024];

        loop {
            let n = reader.read(&mut buf).map_err(|e| e.to_string())?;
            if n == 0 {
                break;
            }
            file.write_all(&buf[..n]).map_err(|e| e.to_string())?;
            received += n as u64;
            let _ = channel.send(UpdateProgress {
                stage: "downloading".to_string(),
                received,
                total,
                path: None,
            });
        }

        file.flush().map_err(|e| e.to_string())?;
        drop(file);
        std::fs::rename(&tmp_path, &final_path).map_err(|e| e.to_string())?;

        let _ = channel.send(UpdateProgress {
            stage: "complete".to_string(),
            received,
            total,
            path: Some(final_path.to_string_lossy().to_string()),
        });
        Ok(())
    });

    Ok(())
}

#[tauri::command]
pub fn install_update(app: AppHandle, path: String) -> Result<(), String> {
    std::process::Command::new(&path)
        .spawn()
        .map_err(|e| format!("Failed to launch installer: {}", e))?;
    app.exit(0);
    Ok(())
}
