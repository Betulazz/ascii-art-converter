pub fn luminance(red: u8, green: u8, blue: u8) -> f32 {
    (0.2126 * red as f32) + (0.7152 * green as f32) + (0.0722 * blue as f32)
}

pub fn map_luminance_to_char(luminance: f32, charset: &[char], invert: bool) -> char {
    if charset.is_empty() {
        return ' ';
    }

    let max_index = charset.len().saturating_sub(1);
    let normalized = (luminance / 255.0).clamp(0.0, 1.0);
    let index = (normalized * max_index as f32).round() as usize;
    let mapped_index = if invert { max_index - index } else { index };
    charset[mapped_index]
}

pub fn rgb_to_hex(red: u8, green: u8, blue: u8) -> String {
    format!("#{red:02x}{green:02x}{blue:02x}")
}
