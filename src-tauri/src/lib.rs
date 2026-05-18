mod commands;
mod errors;
mod image_ascii;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::convert_image_to_ascii,
            commands::export_ascii_txt
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
