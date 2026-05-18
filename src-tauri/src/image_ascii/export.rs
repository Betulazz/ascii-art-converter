use std::fs;
use std::path::PathBuf;

use crate::errors::AppError;
use crate::image_ascii::options::ExportTxtRequest;

pub fn write_txt(input: ExportTxtRequest) -> Result<String, AppError> {
    if input.text.is_empty() {
        return Err(AppError::Validation("Cannot export empty ASCII art.".to_string()));
    }

    let path = PathBuf::from(input.path);
    fs::write(&path, input.text).map_err(|error| AppError::Io(error.to_string()))?;
    Ok(path.to_string_lossy().to_string())
}
