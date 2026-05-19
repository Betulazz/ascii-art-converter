use crate::errors::AppError;
use crate::image_ascii::converter::{convert_gif, convert_image};
use crate::image_ascii::export::{write_gif, write_txt};
use crate::image_ascii::options::{
    AsciiResult, ExportGifRequest, ExportTxtRequest, GifAsciiResult, ImageAsciiRequest,
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
