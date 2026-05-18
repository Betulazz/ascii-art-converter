use image::imageops::FilterType;
use image::{DynamicImage, GenericImageView, ImageFormat};

use crate::errors::AppError;
use crate::image_ascii::options::{AsciiResult, ColoredCell, ImageAsciiRequest};
use crate::image_ascii::palette::{luminance, map_luminance_to_char, rgb_to_hex};

const CHARACTER_ASPECT_RATIO: f32 = 0.5;
const MAX_OUTPUT_WIDTH: u32 = 400;

pub fn convert_image(input: ImageAsciiRequest) -> Result<AsciiResult, AppError> {
    validate_request(&input)?;
    validate_extension(&input.file_name)?;

    let format = ImageFormat::from_path(&input.file_name).map_err(|_| AppError::UnsupportedFormat)?;
    let image = image::load_from_memory_with_format(&input.image_bytes, format)
        .map_err(|error| AppError::ImageDecode(error.to_string()))?;

    Ok(convert_dynamic_image(
        &image,
        input.output_width,
        &input.charset,
        input.invert,
        input.preserve_aspect_ratio,
        input.color_preview,
    ))
}

fn validate_request(input: &ImageAsciiRequest) -> Result<(), AppError> {
    if input.image_bytes.is_empty() {
        return Err(AppError::Validation("Image bytes cannot be empty.".to_string()));
    }
    if input.output_width == 0 || input.output_width > MAX_OUTPUT_WIDTH {
        return Err(AppError::Validation(format!(
            "Output width must be between 1 and {MAX_OUTPUT_WIDTH}."
        )));
    }
    if input.charset.trim().is_empty() {
        return Err(AppError::Validation("Charset cannot be empty.".to_string()));
    }
    Ok(())
}

fn validate_extension(file_name: &str) -> Result<(), AppError> {
    let is_supported = file_name
        .rsplit_once('.')
        .map(|(_, extension)| matches!(extension.to_ascii_lowercase().as_str(), "png" | "jpg" | "jpeg" | "bmp" | "webp"))
        .unwrap_or(false);

    if is_supported {
        Ok(())
    } else {
        Err(AppError::UnsupportedFormat)
    }
}

pub fn convert_dynamic_image(
    image: &DynamicImage,
    output_width: u32,
    charset: &str,
    invert: bool,
    preserve_aspect_ratio: bool,
    color_preview: bool,
) -> AsciiResult {
    let (source_width, source_height) = image.dimensions();
    let aspect_ratio = source_height as f32 / source_width.max(1) as f32;
    let height_scale = if preserve_aspect_ratio { CHARACTER_ASPECT_RATIO } else { 1.0 };
    let output_height = ((output_width as f32 * aspect_ratio * height_scale).round() as u32).max(1);
    let resized = image.resize_exact(output_width, output_height, FilterType::Triangle).to_rgb8();
    let charset_chars: Vec<char> = charset.chars().collect();
    let mut text = String::with_capacity((output_width * (output_height + 1)) as usize);
    let mut colored_cells = color_preview.then(Vec::new);

    for y in 0..output_height {
        for x in 0..output_width {
            let pixel = resized.get_pixel(x, y);
            let [red, green, blue] = pixel.0;
            let ascii_char = map_luminance_to_char(luminance(red, green, blue), &charset_chars, invert);
            text.push(ascii_char);

            if let Some(cells) = colored_cells.as_mut() {
                cells.push(ColoredCell {
                    char: ascii_char.to_string(),
                    foreground: rgb_to_hex(red, green, blue),
                });
            }
        }
        if y + 1 < output_height {
            text.push('\n');
        }
    }

    AsciiResult {
        text,
        width: output_width,
        height: output_height,
        colored_cells,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{DynamicImage, Rgb, RgbImage};

    #[test]
    fn output_width_controls_ascii_width() {
        let image = sample_image();
        let result = convert_dynamic_image(&image, 4, "@. ", false, true, false);

        assert_eq!(result.width, 4);
        assert!(result.text.lines().all(|line| line.len() == 4));
    }

    #[test]
    fn invert_reverses_character_mapping() {
        let image = DynamicImage::ImageRgb8(RgbImage::from_pixel(1, 1, Rgb([0, 0, 0])));
        let normal = convert_dynamic_image(&image, 1, "@.", false, false, false);
        let inverted = convert_dynamic_image(&image, 1, "@.", true, false, false);

        assert_eq!(normal.text, "@");
        assert_eq!(inverted.text, ".");
    }

    #[test]
    fn color_preview_returns_one_cell_per_character() {
        let image = sample_image();
        let result = convert_dynamic_image(&image, 3, "@. ", false, false, true);

        assert_eq!(result.colored_cells.as_ref().unwrap().len(), (result.width * result.height) as usize);
        assert!(result.colored_cells.unwrap()[0].foreground.starts_with('#'));
    }

    fn sample_image() -> DynamicImage {
        let mut image = RgbImage::new(2, 2);
        image.put_pixel(0, 0, Rgb([0, 0, 0]));
        image.put_pixel(1, 0, Rgb([255, 255, 255]));
        image.put_pixel(0, 1, Rgb([128, 128, 128]));
        image.put_pixel(1, 1, Rgb([64, 128, 192]));
        DynamicImage::ImageRgb8(image)
    }
}
