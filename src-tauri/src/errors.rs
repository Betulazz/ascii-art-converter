use serde::ser::{Serialize, Serializer};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("{0}")]
    Validation(String),
    #[error("Unsupported image format. Supported formats: PNG, JPG, JPEG, BMP, WEBP.")]
    UnsupportedFormat,
    #[error("Failed to decode image: {0}")]
    ImageDecode(String),
    #[error("Failed to write file: {0}")]
    Io(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
