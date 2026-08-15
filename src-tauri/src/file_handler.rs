use serde_json::json;

#[tauri::command]
pub fn get_supported_extensions() -> String {
    let extensions = json!({
        "video": ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "ts", "m2ts", "3gp", "ogv", "rm", "rmvb", "vob", "asf", "divx", "f4v", "m4v", "mpg", "mpeg", "3g2", "mts", "mxf", "nsv", "ogm"],
        "audio": ["mp3", "flac", "aac", "ogg", "wav", "wma", "m4a", "opus", "ac3", "dts", "alac", "aiff", "ape", "mid", "midi", "ra", "tta", "tak", "dsf", "dff", "ape"],
        "image": ["jpg", "jpeg", "png", "bmp", "gif", "tiff", "tif", "webp", "svg", "ico", "heic", "heif", "avif", "jxl", "psd", "tga", "hdr", "exr", "pcx", "pgm", "ppm", "pnm", "sfw"],
        "subtitle": ["srt", "ass", "ssa", "sub", "idx", "vtt", "sup", "smi", "lrc", "txt"],
        "playlist": ["m3u", "m3u8", "pls", "cue", "xspf", "asx"]
    });
    extensions.to_string()
}

pub fn is_media_file(path: &str) -> bool {
    let ext = path.rsplit('.').next().unwrap_or("").to_lowercase();
    let video = [
        "mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "ts", "m2ts", "3gp", "ogv", "rm", "rmvb",
        "vob", "asf", "divx", "f4v", "m4v", "mpg", "mpeg", "3g2", "mts", "mxf", "nsv", "ogm",
    ];
    let audio = [
        "mp3", "flac", "aac", "ogg", "wav", "wma", "m4a", "opus", "ac3", "dts", "alac", "aiff",
        "ape", "mid", "midi", "ra", "tta", "tak", "dsf", "dff",
    ];
    let image = [
        "jpg", "jpeg", "png", "bmp", "gif", "tiff", "tif", "webp", "svg", "ico", "heic", "heif",
        "avif", "jxl", "psd", "tga", "hdr", "exr", "pcx", "pgm", "ppm", "pnm", "sfw",
    ];

    video.contains(&ext.as_str()) || audio.contains(&ext.as_str()) || image.contains(&ext.as_str())
}

pub fn get_media_type(path: &str) -> String {
    let ext = path.rsplit('.').next().unwrap_or("").to_lowercase();
    let video = [
        "mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "ts", "m2ts", "3gp", "ogv", "rm", "rmvb",
        "vob", "asf", "divx", "f4v", "m4v", "mpg", "mpeg", "3g2", "mts", "mxf", "nsv", "ogm",
    ];
    let audio = [
        "mp3", "flac", "aac", "ogg", "wav", "wma", "m4a", "opus", "ac3", "dts", "alac", "aiff",
        "ape", "mid", "midi", "ra", "tta", "tak", "dsf", "dff",
    ];
    let image = [
        "jpg", "jpeg", "png", "bmp", "gif", "tiff", "tif", "webp", "svg", "ico", "heic", "heif",
        "avif", "jxl", "psd", "tga", "hdr", "exr", "pcx", "pgm", "ppm", "pnm", "sfw",
    ];

    if video.contains(&ext.as_str()) {
        "video".to_string()
    } else if audio.contains(&ext.as_str()) {
        "audio".to_string()
    } else if image.contains(&ext.as_str()) {
        "image".to_string()
    } else {
        "unknown".to_string()
    }
}
