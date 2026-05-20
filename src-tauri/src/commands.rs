use crate::errors::AppError;
use crate::image_ascii::converter::{convert_gif, convert_image};
use crate::image_ascii::export::{open_console, write_gif, write_png, write_txt};
use crate::image_ascii::options::{
    AsciiResult, ExportConsoleRequest, ExportGifRequest, ExportPngRequest, ExportTxtRequest,
    GifAsciiResult, ImageAsciiRequest,
};

#[tauri::command]
pub fn convert_image_to_ascii(input: ImageAsciiRequest) -> Result<AsciiResult, AppError> {
    convert_image(input)
}

#[tauri::command]
pub fn convert_gif_to_ascii(input: ImageAsciiRequest) -> Result<GifAsciiResult, AppError> {
    convert_gif(input)
}

#[tauri::command]
pub fn export_ascii_txt(input: ExportTxtRequest) -> Result<String, AppError> {
    write_txt(input)
}

#[tauri::command]
pub fn export_ascii_gif(input: ExportGifRequest) -> Result<String, AppError> {
    write_gif(input)
}

#[tauri::command]
pub fn export_ascii_png(input: ExportPngRequest) -> Result<String, AppError> {
    write_png(input)
}

#[tauri::command]
pub fn export_ascii_console(input: ExportConsoleRequest) -> Result<String, AppError> {
    open_console(input)
}
