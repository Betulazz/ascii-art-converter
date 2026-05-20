use std::fs;
use std::path::PathBuf;
use std::process::Command;

use crate::errors::AppError;
use crate::image_ascii::options::{
    ColoredCell, ExportConsoleFrame, ExportConsoleRequest, ExportGifRequest, ExportPngRequest, ExportTxtRequest,
};

const AUTO_TARGET_WIDTH: u32 = 160;
const AUTO_TARGET_HEIGHT: u32 = 45;
const MAX_CONSOLE_COLUMNS: u32 = 240;
const MAX_CONSOLE_FRAME_LINES: u32 = 70;
const CONSOLE_EXTRA_LINES: u32 = 4;

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
    let script_path = work_dir.join("show-ascii.ps1");
    let scale_mode = ConsoleScaleMode::from_option(input.scale_mode.as_deref());

    if let Some(frames) = input.frames.filter(|frames| !frames.is_empty()) {
        let frame_files = write_console_frames(&work_dir, frames, scale_mode)?;
        let layout = console_layout(frame_files.iter().map(|frame| (frame.width, frame.height)), scale_mode);
        fs::write(
            &script_path,
            build_gif_console_script(&frame_files, layout.columns, layout.lines, layout.font_size),
        )
            .map_err(|error| AppError::Io(error.to_string()))?;
    } else {
        let text = input.text.unwrap_or_default();
        if text.is_empty() {
            return Err(AppError::Validation(
                "Cannot output empty ASCII art to CMD.".to_string(),
            ));
        }

        let content = render_console_content(ConsoleRenderInput {
            text,
            width: input.width,
            height: input.height,
            colored_cells: input.colored_cells,
            scale_mode,
        })?;
        let text_path = work_dir.join("ascii-art.txt");
        fs::write(&text_path, content.text).map_err(|error| AppError::Io(error.to_string()))?;
        let layout = console_layout([(content.width, content.height)], scale_mode);
        fs::write(
            &script_path,
            build_static_console_script(&text_path, layout.columns, layout.lines, layout.font_size),
        )
            .map_err(|error| AppError::Io(error.to_string()))?;
    }

    launch_cmd_window(&input.title, &script_path)?;
    Ok("Opened CMD console.".to_string())
}

struct ConsoleFrameFile {
    path: PathBuf,
    delay_ms: u32,
    width: u32,
    height: u32,
}

#[derive(Clone, Copy)]
enum ConsoleScaleMode {
    Auto,
    Full,
    ThreeQuarter,
    Half,
}

struct ConsoleRenderInput {
    text: String,
    width: Option<u32>,
    height: Option<u32>,
    colored_cells: Option<Vec<ColoredCell>>,
    scale_mode: ConsoleScaleMode,
}

struct ConsoleRenderContent {
    text: String,
    width: u32,
    height: u32,
}

struct ConsoleLayout {
    columns: u32,
    lines: u32,
    font_size: u32,
}

fn write_console_frames(
    work_dir: &std::path::Path,
    frames: Vec<ExportConsoleFrame>,
    scale_mode: ConsoleScaleMode,
) -> Result<Vec<ConsoleFrameFile>, AppError> {
    let mut rendered_frames = Vec::with_capacity(frames.len());
    let mut max_width = 1u32;
    let mut max_height = 1u32;

    for frame in frames {
        if frame.text.is_empty() {
            return Err(AppError::Validation(
                "Cannot output empty GIF frame to CMD.".to_string(),
            ));
        }

        let delay_ms = frame.delay_ms;
        let content = render_console_content(ConsoleRenderInput {
            text: frame.text,
            width: frame.width,
            height: frame.height,
            colored_cells: frame.colored_cells,
            scale_mode,
        })?;
        max_width = max_width.max(content.width);
        max_height = max_height.max(content.height);
        rendered_frames.push((delay_ms, content));
    }

    rendered_frames
        .into_iter()
        .enumerate()
        .map(|(index, (delay_ms, content))| {
            let path = work_dir.join(format!("frame-{:04}.txt", index + 1));
            fs::write(&path, pad_console_frame_text(&content.text, max_width, max_height))
                .map_err(|error| AppError::Io(error.to_string()))?;
            Ok(ConsoleFrameFile {
                path,
                delay_ms,
                width: max_width,
                height: max_height,
            })
        })
        .collect()
}

impl ConsoleScaleMode {
    fn from_option(value: Option<&str>) -> Self {
        match value {
            Some("100") => Self::Full,
            Some("75") => Self::ThreeQuarter,
            Some("50") => Self::Half,
            _ => Self::Auto,
        }
    }
}

fn render_console_content(input: ConsoleRenderInput) -> Result<ConsoleRenderContent, AppError> {
    let lines: Vec<Vec<char>> = input.text.lines().map(|line| line.chars().collect()).collect();
    let original_width = input
        .width
        .unwrap_or_else(|| lines.iter().map(|line| line.len() as u32).max().unwrap_or(0));
    let original_height = input.height.unwrap_or(lines.len() as u32);
    if original_width == 0 || original_height == 0 {
        return Err(AppError::Validation(
            "Cannot output empty ASCII art to CMD.".to_string(),
        ));
    }

    let (target_width, target_height) = console_target_dimensions(original_width, original_height, input.scale_mode);
    let mut rendered = String::new();

    for output_y in 0..target_height {
        if output_y > 0 {
            rendered.push('\n');
        }

        let y = (output_y * original_height / target_height).min(original_height - 1);
        for output_x in 0..target_width {
            let x = (output_x * original_width / target_width).min(original_width - 1);
            let char_value = lines
                .get(y as usize)
                .and_then(|line| line.get(x as usize))
                .copied()
                .unwrap_or(' ');

            if let Some(cell) = input
                .colored_cells
                .as_ref()
                .and_then(|cells| cells.get((y * original_width + x) as usize))
            {
                rendered.push_str(&ansi_colored_char(cell, char_value));
            } else {
                rendered.push(char_value);
            }
        }
    }

    if input.colored_cells.is_some() {
        rendered.push_str("\u{1b}[0m");
    }

    Ok(ConsoleRenderContent {
        text: rendered,
        width: target_width,
        height: target_height,
    })
}

fn pad_console_frame_text(text: &str, width: u32, height: u32) -> String {
    let mut padded = String::new();
    let lines = text.lines().collect::<Vec<_>>();

    for y in 0..height as usize {
        if y > 0 {
            padded.push('\n');
        }
        let line = lines.get(y).copied().unwrap_or("");
        padded.push_str(line);
        let visible_width = line.chars().count() as u32;
        for _ in visible_width..width {
            padded.push(' ');
        }
    }

    padded
}

fn console_target_dimensions(width: u32, height: u32, scale_mode: ConsoleScaleMode) -> (u32, u32) {
    let (target_width, target_height) = match scale_mode {
        ConsoleScaleMode::Full => (width, height),
        ConsoleScaleMode::ThreeQuarter => (scaled_dimension(width, 3, 4), scaled_dimension(height, 3, 4)),
        ConsoleScaleMode::Half => (scaled_dimension(width, 1, 2), scaled_dimension(height, 1, 2)),
        ConsoleScaleMode::Auto => {
            let scale_denominator = width.div_ceil(AUTO_TARGET_WIDTH).max(height.div_ceil(AUTO_TARGET_HEIGHT)).max(1);
            (width.div_ceil(scale_denominator), height.div_ceil(scale_denominator))
        }
    };

    fit_console_dimensions(target_width, target_height, MAX_CONSOLE_COLUMNS, MAX_CONSOLE_FRAME_LINES)
}

fn scaled_dimension(value: u32, numerator: u32, denominator: u32) -> u32 {
    ((value * numerator).div_ceil(denominator)).max(1)
}

fn fit_console_dimensions(width: u32, height: u32, max_width: u32, max_height: u32) -> (u32, u32) {
    let scale_denominator = width.div_ceil(max_width).max(height.div_ceil(max_height)).max(1);
    (width.div_ceil(scale_denominator).max(1), height.div_ceil(scale_denominator).max(1))
}

fn ansi_colored_char(cell: &ColoredCell, fallback: char) -> String {
    let char_value = cell.char.chars().next().unwrap_or(fallback);
    if let Some((red, green, blue)) = parse_hex_color(&cell.foreground) {
        format!("\u{1b}[38;2;{red};{green};{blue}m{char_value}")
    } else {
        char_value.to_string()
    }
}

fn parse_hex_color(value: &str) -> Option<(u8, u8, u8)> {
    let hex = value.strip_prefix('#')?;
    if hex.len() != 6 {
        return None;
    }
    let red = u8::from_str_radix(&hex[0..2], 16).ok()?;
    let green = u8::from_str_radix(&hex[2..4], 16).ok()?;
    let blue = u8::from_str_radix(&hex[4..6], 16).ok()?;
    Some((red, green, blue))
}

fn console_layout<I>(dimensions: I, scale_mode: ConsoleScaleMode) -> ConsoleLayout
where
    I: IntoIterator<Item = (u32, u32)>,
{
    let (width, height) = dimensions
        .into_iter()
        .fold((1u32, 1u32), |(max_width, max_height), (width, height)| {
            (max_width.max(width), max_height.max(height))
        });
    let font_size = match scale_mode {
        ConsoleScaleMode::Full => 12,
        ConsoleScaleMode::ThreeQuarter => 10,
        ConsoleScaleMode::Half | ConsoleScaleMode::Auto => 8,
    };

    ConsoleLayout {
        columns: width.clamp(40, MAX_CONSOLE_COLUMNS),
        lines: (height + CONSOLE_EXTRA_LINES).clamp(12, MAX_CONSOLE_FRAME_LINES + CONSOLE_EXTRA_LINES),
        font_size,
    }
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
        .args([
            "/C",
            "start",
            "",
            "cmd",
            "/C",
            "powershell",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            &script_arg,
        ])
        .spawn()
        .map_err(|error| AppError::Io(error.to_string()))?;
    Ok(())
}

fn build_static_console_script(text_path: &std::path::Path, columns: u32, lines: u32, font_size: u32) -> String {
    format!(
        "{}\r\nSet-ConsoleFontSize {font_size}\r\ncmd /c \"mode con: cols={columns} lines={lines}\"\r\nClear-Host\r\nGet-Content -LiteralPath '{}' -Raw -Encoding UTF8 | Write-Host -NoNewline\r\nWrite-Host\r\nRead-Host 'Press Enter to close'\r\n",
        powershell_console_font_helper(),
        escape_powershell_single_quoted(&text_path.to_string_lossy())
    )
}

fn build_gif_console_script(frames: &[ConsoleFrameFile], columns: u32, lines: u32, font_size: u32) -> String {
    let mut script = format!(
        "{}\r\nSet-ConsoleFontSize {font_size}\r\ncmd /c \"mode con: cols={columns} lines={lines}\"\r\n$esc = [char]27\r\n[Console]::Write(\"$esc[?1049h$esc[?25l$esc[2J$esc[H\")\r\n[Console]::CursorVisible = $false\r\ntry {{\r\n",
        powershell_console_font_helper()
    );
    script.push_str("while ($true) {\r\n");
    for frame in frames {
        script.push_str("  [Console]::Write(\"$esc[H\")\r\n");
        script.push_str(&format!(
            "  $frameText = Get-Content -LiteralPath '{}' -Raw -Encoding UTF8\r\n",
            escape_powershell_single_quoted(&frame.path.to_string_lossy())
        ));
        script.push_str("  [Console]::Write($frameText)\r\n");
        script.push_str(&format!(
            "  Start-Sleep -Milliseconds {}\r\n",
            frame.delay_ms
        ));
    }
    script.push_str("}\r\n");
    script.push_str("} finally {\r\n  [Console]::CursorVisible = $true\r\n  [Console]::Write(\"$esc[?25h$esc[?1049l\")\r\n}\r\n");
    script
}

fn powershell_console_font_helper() -> &'static str {
    r#"
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class ConsoleFont {
  [StructLayout(LayoutKind.Sequential)]
  public struct COORD { public short X; public short Y; }
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct CONSOLE_FONT_INFO_EX {
    public uint cbSize;
    public uint nFont;
    public COORD dwFontSize;
    public int FontFamily;
    public int FontWeight;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
    public string FaceName;
  }
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern IntPtr GetStdHandle(int nStdHandle);
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool GetCurrentConsoleFontEx(IntPtr hConsoleOutput, bool bMaximumWindow, ref CONSOLE_FONT_INFO_EX lpConsoleCurrentFontEx);
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool SetCurrentConsoleFontEx(IntPtr hConsoleOutput, bool bMaximumWindow, ref CONSOLE_FONT_INFO_EX lpConsoleCurrentFontEx);
}
"@
function Set-ConsoleFontSize([int]$Size) {
  $handle = [ConsoleFont]::GetStdHandle(-11)
  $info = New-Object ConsoleFont+CONSOLE_FONT_INFO_EX
  $info.cbSize = [Runtime.InteropServices.Marshal]::SizeOf($info)
  if ([ConsoleFont]::GetCurrentConsoleFontEx($handle, $false, [ref]$info)) {
    $info.dwFontSize.Y = [Math]::Max(5, [Math]::Min(24, $Size))
    [ConsoleFont]::SetCurrentConsoleFontEx($handle, $false, [ref]$info) | Out-Null
  }
}
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [Console]::OutputEncoding
"#
}

fn escape_powershell_single_quoted(value: &str) -> String {
    value.replace('\'', "''")
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
        let script = build_static_console_script(&PathBuf::from("C:\\Temp\\ascii art.txt"), 80, 24, 8);

        assert!(script.contains("[Console]::OutputEncoding"));
        assert!(script.contains("Get-Content -LiteralPath 'C:\\Temp\\ascii art.txt'"));
        assert!(script.contains("Read-Host 'Press Enter to close'"));
    }

    #[test]
    fn gif_console_script_loops_and_waits_between_frames() {
        let script = build_gif_console_script(
            &[
                ConsoleFrameFile {
                    path: PathBuf::from("C:\\Temp\\frame-1.txt"),
                    delay_ms: 50,
                    width: 2,
                    height: 1,
                },
                ConsoleFrameFile {
                    path: PathBuf::from("C:\\Temp\\frame-2.txt"),
                    delay_ms: 80,
                    width: 2,
                    height: 1,
                },
            ],
            80,
            24,
            8,
        );

        assert!(script.contains("while ($true)"));
        assert!(script.contains("$esc[?1049h"));
        assert!(script.contains("$esc[H"));
        assert!(!script.contains("Clear-Host"));
        assert!(script.contains("Get-Content -LiteralPath 'C:\\Temp\\frame-1.txt'"));
        assert!(script.contains("Start-Sleep -Milliseconds 50"));
        assert!(script.contains("Get-Content -LiteralPath 'C:\\Temp\\frame-2.txt'"));
        assert!(script.contains("Start-Sleep -Milliseconds 80"));
        assert!(!script.contains("Read-Host 'Press Enter to close'"));
    }

    #[test]
    fn gif_console_script_hides_cursor_and_uses_raw_frame_writes() {
        let script = build_gif_console_script(
            &[ConsoleFrameFile {
                path: PathBuf::from("C:\\Temp\\frame-1.txt"),
                delay_ms: 50,
                width: 2,
                height: 1,
            }],
            80,
            24,
            8,
        );

        assert!(script.contains("[Console]::CursorVisible = $false"));
        assert!(script.contains("[Console]::Write($frameText)"));
        assert!(script.contains("finally {"));
        assert!(script.contains("[Console]::CursorVisible = $true"));
        assert!(script.contains("$esc[?1049l"));
    }

    #[test]
    fn colored_console_content_uses_truecolor_ansi_sequences() {
        let content = render_console_content(ConsoleRenderInput {
            text: "@.".to_string(),
            width: Some(2),
            height: Some(1),
            colored_cells: Some(vec![
                crate::image_ascii::options::ColoredCell {
                    char: "@".to_string(),
                    foreground: "#ff0000".to_string(),
                },
                crate::image_ascii::options::ColoredCell {
                    char: ".".to_string(),
                    foreground: "#00ff00".to_string(),
                },
            ]),
            scale_mode: ConsoleScaleMode::Full,
        })
        .unwrap();

        assert!(content.text.contains("\u{1b}[38;2;255;0;0m@"));
        assert!(content.text.contains("\u{1b}[38;2;0;255;0m."));
        assert!(content.text.contains("\u{1b}[0m"));
    }

    #[test]
    fn scaled_console_content_samples_rows_and_columns() {
        let content = render_console_content(ConsoleRenderInput {
            text: "abcd\nefgh\nijkl\nmnop".to_string(),
            width: Some(4),
            height: Some(4),
            colored_cells: None,
            scale_mode: ConsoleScaleMode::Half,
        })
        .unwrap();

        assert_eq!(content.text, "ac\nik");
        assert_eq!(content.width, 2);
        assert_eq!(content.height, 2);
    }

    #[test]
    fn full_scale_console_content_fits_inside_visible_console_area() {
        let content = render_console_content(ConsoleRenderInput {
            text: (0..160).map(|_| "@".repeat(120)).collect::<Vec<_>>().join("\n"),
            width: Some(120),
            height: Some(160),
            colored_cells: None,
            scale_mode: ConsoleScaleMode::Full,
        })
        .unwrap();

        assert!(content.width <= MAX_CONSOLE_COLUMNS);
        assert!(content.height <= MAX_CONSOLE_FRAME_LINES);
    }

    #[test]
    fn animated_console_layout_keeps_frame_area_below_window_height() {
        let layout = console_layout([(120, MAX_CONSOLE_FRAME_LINES)], ConsoleScaleMode::Full);

        assert_eq!(layout.lines, MAX_CONSOLE_FRAME_LINES + CONSOLE_EXTRA_LINES);
    }

    #[test]
    fn powershell_console_script_sets_window_font_size() {
        let script = build_static_console_script(&PathBuf::from("C:\\Temp\\ascii-art.txt"), 80, 24, 8);

        assert!(script.contains("Set-ConsoleFontSize 8"));
        assert!(script.contains("mode con: cols=80 lines=24"));
    }
}
