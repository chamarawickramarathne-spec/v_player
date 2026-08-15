use serde::Serialize;
use std::fs::File;
use std::io::{Read, Write};
use std::thread;
use tauri::{AppHandle, Manager};

pub const GITHUB_OWNER: &str = "chamarawickramarathne-spec";
pub const GITHUB_REPO: &str = "v_player";
pub const INSTALLER_ASSET: &str = "VPlayer-Setup-x64.exe";

#[derive(Debug, Clone, Serialize)]
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

fn releases_atom_url() -> String {
    format!(
        "https://github.com/{}/{}/releases.atom",
        GITHUB_OWNER, GITHUB_REPO
    )
}

fn github_error(e: ureq::Error) -> String {
    match e {
        ureq::Error::Status(code, _) if code == 403 || code == 429 => {
            "GitHub API rate limit reached - try again in a few minutes".to_string()
        }
        other => format!("Failed to reach GitHub: {}", other),
    }
}

fn strip_v(tag: &str) -> &str {
    tag.strip_prefix('v').unwrap_or(tag)
}

fn api_latest() -> Result<serde_json::Value, String> {
    let resp = ureq::get(&releases_latest_url())
        .set("User-Agent", "VPlayer-Updater")
        .set("Accept", "application/vnd.github+json")
        .call()
        .map_err(github_error)?;

    let json: serde_json::Value =
        serde_json::from_str(&resp.into_string().map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?;

    if let Some(message) = json.get("message").and_then(|m| m.as_str()) {
        return Err(format!("GitHub API error: {}", message));
    }

    Ok(json)
}

fn atom_latest_tag() -> Result<String, String> {
    let resp = ureq::get(&releases_atom_url())
        .set("User-Agent", "VPlayer-Updater")
        .call()
        .map_err(|e| format!("Failed to reach GitHub releases feed: {}", e))?;

    let body = resp.into_string().map_err(|e| e.to_string())?;
    let start = body
        .find("<entry")
        .ok_or_else(|| "No releases found in feed".to_string())?;
    let entry = &body[start..];
    let title_start = entry
        .find("<title>")
        .ok_or_else(|| "No title in feed entry".to_string())?
        + "<title>".len();
    let title_end = entry[title_start..]
        .find("</title>")
        .map(|i| title_start + i)
        .ok_or_else(|| "No closing title in feed entry".to_string())?;
    Ok(entry[title_start..title_end].trim().to_string())
}

fn asset_from_json(json: &serde_json::Value) -> (String, String, Option<u64>) {
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
    match asset {
        Some(a) => (
            a["name"].as_str().unwrap_or("").to_string(),
            a["browser_download_url"].as_str().unwrap_or("").to_string(),
            a["size"].as_u64(),
        ),
        None => (String::new(), String::new(), None),
    }
}

fn download_url_for_tag(tag: &str) -> String {
    format!(
        "https://github.com/{}/{}/releases/download/v{}/{}",
        GITHUB_OWNER, GITHUB_REPO, tag, INSTALLER_ASSET
    )
}

#[tauri::command]
pub fn get_app_version(app: AppHandle) -> Result<String, String> {
    Ok(app.package_info().version.to_string())
}

fn do_check_for_update(current: &str) -> Result<UpdateInfo, String> {
    let (latest, release_notes, asset_name, download_url, size_bytes) =
        match api_latest() {
            Ok(json) => {
                let tag = strip_v(json["tag_name"].as_str().unwrap_or("")).to_string();
                let notes = json["body"].as_str().unwrap_or("").to_string();
                let (name, url, size) = asset_from_json(&json);
                (tag, notes, name, url, size)
            }
            Err(api_err) => {
                // The Atom releases feed is served by github.com, not the API, so it is
                // not subject to the 60/hr unauthenticated API rate limit.
                match atom_latest_tag() {
                    Ok(tag) => {
                        let url = download_url_for_tag(&tag);
                        (
                            tag,
                            String::new(),
                            INSTALLER_ASSET.to_string(),
                            url,
                            None,
                        )
                    }
                    Err(_) => return Err(api_err),
                }
            }
        };

    let has_update = if latest.is_empty() {
        false
    } else {
        let cur = semver::Version::parse(current).unwrap_or(semver::Version::new(0, 0, 0));
        let lat = semver::Version::parse(&latest).unwrap_or(semver::Version::new(0, 0, 0));
        lat > cur
    };

    Ok(UpdateInfo {
        current_version: current.to_string(),
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
pub async fn check_for_update(app: AppHandle) -> Result<UpdateInfo, String> {
    let current = app.package_info().version.to_string();
    tauri::async_runtime::spawn_blocking(move || do_check_for_update(&current))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn download_update(
    app: AppHandle,
    url: String,
    version: String,
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

    thread::spawn(move || {
        let result: Result<(), String> = (|| {
            let _ = channel.send(UpdateProgress {
                stage: "starting".to_string(),
                received: 0,
                total: 0,
                path: None,
            });

            let resp = ureq::get(&url)
                .set("User-Agent", "VPlayer-Updater")
                .call()
                .map_err(|e| format!("Failed to download: {}", e))?;

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

            // Record which version this installer is for so a stale leftover can be
            // detected (and self-cleaned) after the update has been installed.
            let _ = std::fs::write(
                dir.join("update.json"),
                serde_json::json!({ "version": version }).to_string(),
            );

            let _ = channel.send(UpdateProgress {
                stage: "complete".to_string(),
                received,
                total,
                path: Some(final_path.to_string_lossy().to_string()),
            });
            Ok(())
        })();

        if let Err(e) = result {
            eprintln!("[updater] download failed: {}", e);
            let _ = channel.send(UpdateProgress {
                stage: "error".to_string(),
                received: 0,
                total: 0,
                path: Some(e),
            });
        }
    });

    Ok(())
}

#[tauri::command]
pub fn get_downloaded_installer(app: AppHandle) -> Result<Option<String>, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("updates");
    let path = dir.join(INSTALLER_ASSET);
    if !path.exists() {
        return Ok(None);
    }

    // Only offer the leftover installer if it is newer than the running app.
    // Otherwise it is a stale leftover (already installed) -> self-clean it so the
    // "Install & Restart" button does not show forever.
    let meta_path = dir.join("update.json");
    let stored_version = std::fs::read_to_string(&meta_path)
        .ok()
        .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok())
        .and_then(|v| v["version"].as_str().map(str::to_string));

    let stale = match &stored_version {
        Some(stored) => {
            let cur =
                semver::Version::parse(&app.package_info().version.to_string())
                    .unwrap_or(semver::Version::new(0, 0, 0));
            let got = semver::Version::parse(stored).unwrap_or(semver::Version::new(0, 0, 0));
            got <= cur
        }
        // Missing or unreadable metadata: leftover from a pre-fix build (or unknown) ->
        // it cannot be verified as pending, so treat it as stale and self-heal.
        None => true,
    };

    if stale {
        let _ = std::fs::remove_file(&path);
        let _ = std::fs::remove_file(&meta_path);
        return Ok(None);
    }

    Ok(Some(path.to_string_lossy().to_string()))
}

#[tauri::command]
pub fn install_update(app: AppHandle, path: String) -> Result<(), String> {
    let p = std::path::PathBuf::from(&path);
    if !p.exists() {
        return Err(format!("Installer not found: {}", path));
    }
    let child = std::process::Command::new(&p)
        .spawn()
        .map_err(|e| format!("Failed to launch installer: {} ({})", e, path))?;
    drop(child);

    use tauri_plugin_dialog::DialogExt;
    app.dialog()
        .message(
            "The update installer is launching.\n\n\
             If Windows shows a security warning, click \"More info\" then \"Run anyway\".\n\n\
             V Player will close now and restart once installation finishes.",
        )
        .title("V Player Update")
        .show(move |_| {
            app.exit(0);
        });
    Ok(())
}
