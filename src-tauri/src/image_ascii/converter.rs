use std::io::Cursor;

use image::imageops::FilterType;
use image::codecs::gif::GifDecoder;
use image::AnimationDecoder;
use image::{DynamicImage, GenericImageView, ImageFormat};

use crate::errors::AppError;
use crate::image_ascii::options::{AsciiResult, ColoredCell, GifAsciiFrame, GifAsciiResult, ImageAsciiRequest};
use crate::image_ascii::palette::{luminance, map_luminance_to_char, rgb_to_hex};

const CHARACTER_ASPECT_RATIO: f32 = 0.5;
const MAX_OUTPUT_WIDTH: u32 = 400;
const MAX_GIF_FRAMES: usize = 300;
const MIN_FRAME_DELAY_MS: u32 = 20;

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

pub fn convert_gif(input: ImageAsciiRequest) -> Result<GifAsciiResult, AppError> {
    convert_gif_with_frame_limit(input, MAX_GIF_FRAMES)
}

fn convert_gif_with_frame_limit(input: ImageAsciiRequest, max_frames: usize) -> Result<GifAsciiResult, AppError> {
    validate_request(&input)?;
    validate_gif_extension(&input.file_name)?;

    let decoder = GifDecoder::new(Cursor::new(input.image_bytes)).map_err(|error| AppError::ImageDecode(error.to_string()))?;
    let decoded_frames = decoder
        .into_frames()
        .collect_frames()
        .map_err(|error| AppError::ImageDecode(error.to_string()))?;

    if decoded_frames.is_empty() {
        return Err(AppError::ImageDecode("GIF contains no frames.".to_string()));
    }
    if decoded_frames.len() > max_frames {
        return Err(AppError::Validation(format!(
            "GIF contains too many frames. Maximum supported frame count is {MAX_GIF_FRAMES}."
        )));
    }

    let mut frames = Vec::with_capacity(decoded_frames.len());
    let mut total_duration_ms = 0u32;

    for frame in decoded_frames {
        let delay_ms = delay_to_ms(frame.delay()).max(MIN_FRAME_DELAY_MS);
        let converted = convert_dynamic_image(
            &DynamicImage::ImageRgba8(frame.into_buffer()),
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

    Ok(GifAsciiResult {
        frame_count: frames.len(),
        frames,
        width,
        height,
        total_duration_ms,
    })
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

fn validate_gif_extension(file_name: &str) -> Result<(), AppError> {
    let is_supported = file_name
        .rsplit_once('.')
        .map(|(_, extension)| extension.eq_ignore_ascii_case("gif"))
        .unwrap_or(false);

    if is_supported {
        Ok(())
    } else {
        Err(AppError::UnsupportedFormat)
    }
}

fn delay_to_ms(delay: image::Delay) -> u32 {
    let (numerator, denominator) = delay.numer_denom_ms();
    if denominator == 0 {
        return MIN_FRAME_DELAY_MS;
    }
    let rounded_up = (u64::from(numerator) + u64::from(denominator) - 1) / u64::from(denominator);
    rounded_up.min(u64::from(u32::MAX)) as u32
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
    use image::codecs::gif::GifEncoder;
    use image::{Delay, DynamicImage, Frame, Rgb, RgbImage, Rgba, RgbaImage};

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

    #[test]
    fn gif_conversion_returns_frames_with_delays() {
        let result = convert_gif(ImageAsciiRequest {
            image_bytes: sample_two_frame_gif(),
            file_name: "sample.gif".to_string(),
            output_width: 2,
            charset: "@. ".to_string(),
            invert: false,
            preserve_aspect_ratio: false,
            color_preview: false,
        })
        .unwrap();

        assert_eq!(result.frame_count, 2);
        assert_eq!(result.width, 2);
        assert_eq!(result.frames.len(), 2);
        assert!(result.frames.iter().all(|frame| frame.width == 2));
        assert_eq!(result.frames[0].delay_ms, 50);
        assert_eq!(result.frames[1].delay_ms, 80);
        assert_eq!(result.total_duration_ms, 130);
    }

    #[test]
    fn gif_conversion_rejects_non_gif_file_names() {
        let error = convert_gif(ImageAsciiRequest {
            image_bytes: sample_two_frame_gif(),
            file_name: "sample.png".to_string(),
            output_width: 2,
            charset: "@. ".to_string(),
            invert: false,
            preserve_aspect_ratio: false,
            color_preview: false,
        })
        .unwrap_err();

        assert!(matches!(error, AppError::UnsupportedFormat));
    }

    #[test]
    fn gif_conversion_rejects_more_than_maximum_frames() {
        let error = convert_gif_with_frame_limit(
            ImageAsciiRequest {
                image_bytes: sample_two_frame_gif(),
                file_name: "sample.gif".to_string(),
                output_width: 2,
                charset: "@. ".to_string(),
                invert: false,
                preserve_aspect_ratio: false,
                color_preview: false,
            },
            1,
        )
        .unwrap_err();

        assert!(matches!(error, AppError::Validation(message) if message.contains("300")));
    }

    fn sample_image() -> DynamicImage {
        let mut image = RgbImage::new(2, 2);
        image.put_pixel(0, 0, Rgb([0, 0, 0]));
        image.put_pixel(1, 0, Rgb([255, 255, 255]));
        image.put_pixel(0, 1, Rgb([128, 128, 128]));
        image.put_pixel(1, 1, Rgb([64, 128, 192]));
        DynamicImage::ImageRgb8(image)
    }

    fn sample_two_frame_gif() -> Vec<u8> {
        let mut bytes = Vec::new();
        let first = Frame::from_parts(
            RgbaImage::from_pixel(1, 1, Rgba([0, 0, 0, 255])),
            0,
            0,
            Delay::from_numer_denom_ms(50, 1),
        );
        let second = Frame::from_parts(
            RgbaImage::from_pixel(1, 1, Rgba([255, 255, 255, 255])),
            0,
            0,
            Delay::from_numer_denom_ms(80, 1),
        );
        GifEncoder::new(&mut bytes).encode_frames([first, second]).unwrap();
        bytes
    }
}
