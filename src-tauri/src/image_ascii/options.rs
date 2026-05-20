use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageAsciiRequest {
    pub image_bytes: Vec<u8>,
    pub file_name: String,
    pub output_width: u32,
    pub charset: String,
    pub invert: bool,
    pub preserve_aspect_ratio: bool,
    pub color_preview: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AsciiResult {
    pub text: String,
    pub width: u32,
    pub height: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub colored_cells: Option<Vec<ColoredCell>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GifAsciiFrame {
    pub text: String,
    pub width: u32,
    pub height: u32,
    pub delay_ms: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub colored_cells: Option<Vec<ColoredCell>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GifAsciiResult {
    pub frames: Vec<GifAsciiFrame>,
    pub width: u32,
    pub height: u32,
    pub frame_count: usize,
    pub total_duration_ms: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ColoredCell {
    pub char: String,
    pub foreground: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportTxtRequest {
    pub text: String,
    pub path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportGifRequest {
    pub gif_bytes: Vec<u8>,
    pub path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportPngRequest {
    pub png_bytes: Vec<u8>,
    pub path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportConsoleFrame {
    pub text: String,
    pub delay_ms: u32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportConsoleRequest {
    pub title: String,
    pub text: Option<String>,
    pub frames: Option<Vec<ExportConsoleFrame>>,
}
