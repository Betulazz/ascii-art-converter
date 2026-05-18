use crate::errors::AppError;
use crate::image_ascii::converter::convert_image;
use crate::image_ascii::export::write_txt;
use crate::image_ascii::options::{AsciiResult, ExportTxtRequest, ImageAsciiRequest};

#[tauri::command]
pub fn convert_image_to_ascii(input: ImageAsciiRequest) -> Result<AsciiResult, AppError> {
    convert_image(input)
}

#[tauri::command]
pub fn export_ascii_txt(input: ExportTxtRequest) -> Result<String, AppError> {
    write_txt(input)
}
