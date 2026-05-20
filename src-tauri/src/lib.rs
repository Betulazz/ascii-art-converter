mod commands;
mod errors;
mod image_ascii;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::convert_image_to_ascii,
            commands::convert_gif_to_ascii,
            commands::convert_video_to_ascii,
            commands::export_ascii_gif,
            commands::export_ascii_console,
            commands::export_ascii_png,
            commands::export_ascii_video,
            commands::export_ascii_txt
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
