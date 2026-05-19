use std::fs;
use std::path::PathBuf;

use crate::errors::AppError;
use crate::image_ascii::options::{ExportGifRequest, ExportTxtRequest};

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
}
