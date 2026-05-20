use std::fs;
use std::path::PathBuf;
use std::process::Command;

use crate::errors::AppError;
use crate::image_ascii::options::{
    ExportConsoleFrame, ExportConsoleRequest, ExportGifRequest, ExportPngRequest, ExportTxtRequest,
};

pub fn write_txt(input: ExportTxtRequest) -> Result<String, AppError> {
    if input.text.is_empty() {
        return Err(AppError::Validation("Cannot export empty ASCII art.".to_string()));
    }

    let path = PathBuf::from(input.path);
    fs::write(&path, input.text).map_err(|error| AppError::Io(error.to_string()))?;
    Ok(path.to_string_lossy().to_string())
}

pub fn write_gif(input: ExportGifRequest) -> Result<String, AppError> {
    if input.gif_bytes.is_empty() {
        return Err(AppError::Validation("Cannot export empty GIF data.".to_string()));
    }

    let path = PathBuf::from(input.path);
    fs::write(&path, input.gif_bytes).map_err(|error| AppError::Io(error.to_string()))?;
    Ok(path.to_string_lossy().to_string())
}

pub fn write_png(input: ExportPngRequest) -> Result<String, AppError> {
    if input.png_bytes.is_empty() {
        return Err(AppError::Validation("Cannot export empty PNG data.".to_string()));
    }

    let path = PathBuf::from(input.path);
    fs::write(&path, input.png_bytes).map_err(|error| AppError::Io(error.to_string()))?;
    Ok(path.to_string_lossy().to_string())
}

pub fn open_console(input: ExportConsoleRequest) -> Result<String, AppError> {
    let work_dir = create_console_work_dir()?;
    let script_path = work_dir.join("show-ascii.cmd");

    if let Some(frames) = input.frames.filter(|frames| !frames.is_empty()) {
        let frame_files = write_console_frames(&work_dir, frames)?;
        fs::write(&script_path, build_gif_console_script(&frame_files))
            .map_err(|error| AppError::Io(error.to_string()))?;
    } else {
        let text = input.text.unwrap_or_default();
        if text.is_empty() {
            return Err(AppError::Validation(
                "Cannot output empty ASCII art to CMD.".to_string(),
            ));
        }

        let text_path = work_dir.join("ascii-art.txt");
        fs::write(&text_path, text).map_err(|error| AppError::Io(error.to_string()))?;
        fs::write(&script_path, build_static_console_script(&text_path))
            .map_err(|error| AppError::Io(error.to_string()))?;
    }

    launch_cmd_window(&input.title, &script_path)?;
    Ok("Opened CMD console.".to_string())
}

struct ConsoleFrameFile {
    path: PathBuf,
    delay_ms: u32,
}

fn write_console_frames(
    work_dir: &std::path::Path,
    frames: Vec<ExportConsoleFrame>,
) -> Result<Vec<ConsoleFrameFile>, AppError> {
    frames
        .into_iter()
        .enumerate()
        .map(|(index, frame)| {
            if frame.text.is_empty() {
                return Err(AppError::Validation(
                    "Cannot output empty GIF frame to CMD.".to_string(),
                ));
            }

            let path = work_dir.join(format!("frame-{:04}.txt", index + 1));
            fs::write(&path, frame.text).map_err(|error| AppError::Io(error.to_string()))?;
            Ok(ConsoleFrameFile {
                path,
                delay_ms: frame.delay_ms,
            })
        })
        .collect()
}

fn create_console_work_dir() -> Result<PathBuf, AppError> {
    let unique = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|error| AppError::Io(error.to_string()))?
        .as_nanos();
    let dir = std::env::temp_dir().join(format!("ascii-art-console-{unique}"));
    fs::create_dir_all(&dir).map_err(|error| AppError::Io(error.to_string()))?;
    Ok(dir)
}

fn launch_cmd_window(_title: &str, script_path: &std::path::Path) -> Result<(), AppError> {
    let script_arg = script_path.to_string_lossy().to_string();
    Command::new("cmd")
        .args(["/C", "start", "", "cmd", "/C", &script_arg])
        .spawn()
        .map_err(|error| AppError::Io(error.to_string()))?;
    Ok(())
}

fn build_static_console_script(text_path: &std::path::Path) -> String {
    format!(
        "@echo off\r\nchcp 65001 > nul\r\ncls\r\ntype \"{}\"\r\necho.\r\npause\r\n",
        text_path.to_string_lossy()
    )
}

fn build_gif_console_script(frames: &[ConsoleFrameFile]) -> String {
    let mut script = String::from("@echo off\r\nchcp 65001 > nul\r\n");
    for frame in frames {
        script.push_str("cls\r\n");
        script.push_str(&format!("type \"{}\"\r\n", frame.path.to_string_lossy()));
        script.push_str(&format!(
            "powershell -NoProfile -Command \"Start-Sleep -Milliseconds {}\"\r\n",
            frame.delay_ms
        ));
    }
    script.push_str("echo.\r\npause\r\n");
    script
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn write_gif_persists_binary_bytes() {
        let path = std::env::temp_dir().join(format!(
            "ascii-art-export-{}.gif",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));

        let written = write_gif(crate::image_ascii::options::ExportGifRequest {
            gif_bytes: vec![0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
            path: path.to_string_lossy().to_string(),
        })
        .unwrap();

        assert_eq!(written, path.to_string_lossy());
        assert_eq!(std::fs::read(&path).unwrap(), vec![0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn write_png_persists_binary_bytes() {
        let path = std::env::temp_dir().join(format!(
            "ascii-art-export-{}.png",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));

        let written = write_png(crate::image_ascii::options::ExportPngRequest {
            png_bytes: vec![0x89, 0x50, 0x4e, 0x47],
            path: path.to_string_lossy().to_string(),
        })
        .unwrap();

        assert_eq!(written, path.to_string_lossy());
        assert_eq!(std::fs::read(&path).unwrap(), vec![0x89, 0x50, 0x4e, 0x47]);
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn static_console_script_types_text_file_and_pauses() {
        let script = build_static_console_script(&PathBuf::from("C:\\Temp\\ascii art.txt"));

        assert!(script.contains("chcp 65001"));
        assert!(script.contains("type \"C:\\Temp\\ascii art.txt\""));
        assert!(script.contains("pause"));
    }

    #[test]
    fn gif_console_script_clears_and_waits_between_frames() {
        let script = build_gif_console_script(&[
            ConsoleFrameFile {
                path: PathBuf::from("C:\\Temp\\frame-1.txt"),
                delay_ms: 50,
            },
            ConsoleFrameFile {
                path: PathBuf::from("C:\\Temp\\frame-2.txt"),
                delay_ms: 80,
            },
        ]);

        assert!(script.contains("cls"));
        assert!(script.contains("type \"C:\\Temp\\frame-1.txt\""));
        assert!(script.contains("Start-Sleep -Milliseconds 50"));
        assert!(script.contains("type \"C:\\Temp\\frame-2.txt\""));
        assert!(script.contains("Start-Sleep -Milliseconds 80"));
        assert!(script.contains("pause"));
    }
}
