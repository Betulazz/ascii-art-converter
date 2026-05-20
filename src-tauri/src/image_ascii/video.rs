use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::errors::AppError;
use crate::image_ascii::converter::convert_dynamic_image;
use crate::image_ascii::options::{ExportVideoRequest, GifAsciiFrame, VideoAsciiRequest, VideoAsciiResult};

pub const MAX_VIDEO_FRAMES: usize = 600;
#[cfg(test)]
const DEFAULT_VIDEO_FPS: u32 = 8;

pub fn validate_video_request(input: &VideoAsciiRequest) -> Result<(), AppError> {
    if input.path.trim().is_empty() {
        return Err(AppError::Validation("Video path cannot be empty.".to_string()));
    }
    if input.output_width == 0 || input.output_width > 400 {
        return Err(AppError::Validation("Output width must be between 1 and 400.".to_string()));
    }
    if input.charset.trim().is_empty() {
        return Err(AppError::Validation("Charset cannot be empty.".to_string()));
    }
    if input.target_fps == 0 || input.target_fps > 60 {
        return Err(AppError::Validation("Target FPS must be between 1 and 60.".to_string()));
    }
    validate_video_extension(&input.file_name)
}

pub fn validate_video_extension(file_name: &str) -> Result<(), AppError> {
    let is_supported = file_name
        .rsplit_once('.')
        .map(|(_, extension)| matches!(extension.to_ascii_lowercase().as_str(), "mp4" | "webm" | "mov" | "avi" | "mkv"))
        .unwrap_or(false);

    if is_supported {
        Ok(())
    } else {
        Err(AppError::UnsupportedVideoFormat)
    }
}

pub fn validate_export_video_request(input: &ExportVideoRequest) -> Result<(), AppError> {
    if input.frame_png_bytes.is_empty() {
        return Err(AppError::Validation("Cannot export empty video frame data.".to_string()));
    }
    if input.frame_png_bytes.iter().any(Vec::is_empty) {
        return Err(AppError::Validation("Cannot export empty video frame data.".to_string()));
    }
    if input.fps == 0 || input.fps > 60 {
        return Err(AppError::Validation("Video export FPS must be between 1 and 60.".to_string()));
    }
    if input.path.trim().is_empty() {
        return Err(AppError::Validation("Video export path cannot be empty.".to_string()));
    }
    Ok(())
}

pub fn ffmpeg_extract_args(input_path: &Path, target_fps: u32, output_pattern: &Path) -> Vec<String> {
    vec![
        "-y".to_string(),
        "-i".to_string(),
        input_path.to_string_lossy().to_string(),
        "-an".to_string(),
        "-vf".to_string(),
        format!("fps={target_fps}"),
        "-frames:v".to_string(),
        MAX_VIDEO_FRAMES.to_string(),
        output_pattern.to_string_lossy().to_string(),
    ]
}

pub fn ffmpeg_encode_mp4_args(input_pattern: &Path, fps: u32, output_path: &Path) -> Vec<String> {
    vec![
        "-y".to_string(),
        "-framerate".to_string(),
        fps.to_string(),
        "-i".to_string(),
        input_pattern.to_string_lossy().to_string(),
        "-an".to_string(),
        "-c:v".to_string(),
        "libx264".to_string(),
        "-pix_fmt".to_string(),
        "yuv420p".to_string(),
        output_path.to_string_lossy().to_string(),
    ]
}

pub fn convert_video(input: VideoAsciiRequest) -> Result<VideoAsciiResult, AppError> {
    validate_video_request(&input)?;

    let work_dir = create_video_work_dir("extract")?;
    let frame_pattern = numbered_png_pattern(&work_dir, "frame");
    run_ffmpeg(ffmpeg_extract_args(Path::new(&input.path), input.target_fps, &frame_pattern))?;

    let frame_paths = sorted_png_frames(&work_dir)?;
    if frame_paths.is_empty() {
        return Err(AppError::Ffmpeg("FFmpeg did not extract any video frames.".to_string()));
    }
    if frame_paths.len() > MAX_VIDEO_FRAMES {
        return Err(AppError::Validation(format!(
            "Video contains too many sampled frames. Maximum supported frame count is {MAX_VIDEO_FRAMES}."
        )));
    }

    let delay_ms = (1000 / input.target_fps).max(1);
    let mut frames = Vec::with_capacity(frame_paths.len());
    let mut total_duration_ms = 0u32;

    for frame_path in frame_paths {
        let image = image::open(&frame_path).map_err(|error| AppError::ImageDecode(error.to_string()))?;
        let converted = convert_dynamic_image(
            &image,
            input.output_width,
            &input.charset,
            input.invert,
            input.preserve_aspect_ratio,
            input.color_preview,
        );
        total_duration_ms = total_duration_ms.saturating_add(delay_ms);
        frames.push(GifAsciiFrame {
            text: converted.text,
            width: converted.width,
            height: converted.height,
            delay_ms,
            colored_cells: converted.colored_cells,
        });
    }

    let width = frames.first().map(|frame| frame.width).unwrap_or(input.output_width);
    let height = frames.first().map(|frame| frame.height).unwrap_or(0);
    let frame_count = frames.len();
    let _ = fs::remove_dir_all(&work_dir);

    Ok(VideoAsciiResult {
        frames,
        width,
        height,
        frame_count,
        total_duration_ms,
        source_fps: input.target_fps,
    })
}

pub fn export_video(input: ExportVideoRequest) -> Result<String, AppError> {
    validate_export_video_request(&input)?;

    let work_dir = create_video_work_dir("export")?;
    for (index, frame) in input.frame_png_bytes.iter().enumerate() {
        let path = work_dir.join(format!("frame-{:06}.png", index + 1));
        fs::write(path, frame).map_err(|error| AppError::Io(error.to_string()))?;
    }

    let output_path = PathBuf::from(&input.path);
    run_ffmpeg(ffmpeg_encode_mp4_args(&numbered_png_pattern(&work_dir, "frame"), input.fps, &output_path))?;
    let _ = fs::remove_dir_all(&work_dir);

    Ok(output_path.to_string_lossy().to_string())
}

#[allow(dead_code)]
fn numbered_png_pattern(dir: &Path, prefix: &str) -> PathBuf {
    dir.join(format!("{prefix}-%06d.png"))
}

fn create_video_work_dir(label: &str) -> Result<PathBuf, AppError> {
    let unique = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|error| AppError::Io(error.to_string()))?
        .as_nanos();
    let dir = std::env::temp_dir().join(format!("ascii-art-video-{label}-{unique}"));
    fs::create_dir_all(&dir).map_err(|error| AppError::Io(error.to_string()))?;
    Ok(dir)
}

fn sorted_png_frames(dir: &Path) -> Result<Vec<PathBuf>, AppError> {
    let mut frames = fs::read_dir(dir)
        .map_err(|error| AppError::Io(error.to_string()))?
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.extension().is_some_and(|extension| extension.eq_ignore_ascii_case("png")))
        .collect::<Vec<_>>();
    frames.sort();
    Ok(frames)
}

fn run_ffmpeg(args: Vec<String>) -> Result<(), AppError> {
    let binary = ffmpeg_binary();
    let output = Command::new(&binary)
        .args(args)
        .output()
        .map_err(|error| AppError::Ffmpeg(format!("Cannot launch FFmpeg from '{}': {error}", binary.display())))?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    Err(AppError::Ffmpeg(if stderr.is_empty() {
        format!("FFmpeg exited with status {}.", output.status)
    } else {
        stderr
    }))
}

fn ffmpeg_binary() -> PathBuf {
    if let Ok(path) = std::env::var("ASCII_ART_FFMPEG") {
        return PathBuf::from(path);
    }

    for candidate in ffmpeg_binary_candidates() {
        if candidate.is_file() {
            return candidate;
        }
    }

    PathBuf::from("ffmpeg")
}

fn ffmpeg_binary_candidates() -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            candidates.push(dir.join("ffmpeg-x86_64-pc-windows-msvc.exe"));
            candidates.push(dir.join("ffmpeg.exe"));
            candidates.push(dir.join("bin").join("ffmpeg-x86_64-pc-windows-msvc.exe"));
            candidates.push(dir.join("bin").join("ffmpeg.exe"));
        }
    }
    if let Ok(dir) = std::env::current_dir() {
        candidates.push(dir.join("bin").join("ffmpeg-x86_64-pc-windows-msvc.exe"));
        candidates.push(dir.join("bin").join("ffmpeg.exe"));
        candidates.push(dir.join("src-tauri").join("bin").join("ffmpeg-x86_64-pc-windows-msvc.exe"));
        candidates.push(dir.join("src-tauri").join("bin").join("ffmpeg.exe"));
    }
    candidates
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn video_extension_validation_accepts_common_formats() {
        assert!(validate_video_extension("sample.mp4").is_ok());
        assert!(validate_video_extension("sample.WEBM").is_ok());
        assert!(validate_video_extension("sample.mov").is_ok());
        assert!(validate_video_extension("sample.avi").is_ok());
        assert!(validate_video_extension("sample.mkv").is_ok());
    }

    #[test]
    fn video_extension_validation_rejects_images() {
        assert!(matches!(
            validate_video_extension("sample.png"),
            Err(AppError::UnsupportedVideoFormat)
        ));
    }

    #[test]
    fn export_video_rejects_empty_frames() {
        let error = validate_export_video_request(&ExportVideoRequest {
            frame_png_bytes: vec![],
            fps: DEFAULT_VIDEO_FPS,
            path: "C:\\Temp\\ascii.mp4".to_string(),
        })
        .unwrap_err();

        assert!(matches!(error, AppError::Validation(message) if message.contains("empty video frame")));
    }

    #[test]
    fn extract_args_sample_video_at_target_fps() {
        let args = ffmpeg_extract_args(
            Path::new("C:\\Temp\\source.mp4"),
            12,
            Path::new("C:\\Temp\\frames\\frame-%06d.png"),
        );

        assert_eq!(
            args,
            vec![
                "-y",
                "-i",
                "C:\\Temp\\source.mp4",
                "-an",
                "-vf",
                "fps=12",
                "-frames:v",
                "600",
                "C:\\Temp\\frames\\frame-%06d.png"
            ]
        );
    }

    #[test]
    fn extract_args_limit_frames_before_writing_output() {
        let args = ffmpeg_extract_args(
            Path::new("C:\\Temp\\source.mp4"),
            12,
            Path::new("C:\\Temp\\frames\\frame-%06d.png"),
        );

        let limit_index = args.iter().position(|arg| arg == "-frames:v").unwrap();
        assert_eq!(args.get(limit_index + 1).map(String::as_str), Some("600"));
        assert!(limit_index < args.len() - 1);
    }

    #[test]
    fn encode_args_write_silent_h264_mp4() {
        let args = ffmpeg_encode_mp4_args(
            Path::new("C:\\Temp\\ascii\\frame-%06d.png"),
            12,
            Path::new("C:\\Temp\\ascii.mp4"),
        );

        assert!(args.windows(2).any(|pair| pair == ["-c:v", "libx264"]));
        assert!(args.windows(2).any(|pair| pair == ["-pix_fmt", "yuv420p"]));
        assert!(args.contains(&"-an".to_string()));
        assert_eq!(args.last().map(String::as_str), Some("C:\\Temp\\ascii.mp4"));
    }
}
