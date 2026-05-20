use std::fs;
use std::path::Path;

fn main() {
    copy_ffmpeg_sidecar();
    tauri_build::build()
}

fn copy_ffmpeg_sidecar() {
    let source = Path::new("../node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe");
    let target_dir = Path::new("bin");
    let target = target_dir.join("ffmpeg-x86_64-pc-windows-msvc.exe");

    if target.exists() || !source.exists() {
        return;
    }

    if fs::create_dir_all(target_dir).is_ok() {
        let _ = fs::copy(source, target);
    }
}
