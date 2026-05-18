import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import type { AsciiResult, ExportTxtRequest, ImageAsciiRequest } from "../types/ascii";

export async function convertImageToAscii(input: ImageAsciiRequest): Promise<AsciiResult> {
  return invoke<AsciiResult>("convert_image_to_ascii", { input });
}

export async function exportAsciiTxt(input: ExportTxtRequest): Promise<string> {
  return invoke<string>("export_ascii_txt", { input });
}

export async function chooseTxtExportPath(defaultPath: string): Promise<string | null> {
  return save({
    defaultPath,
    filters: [{ name: "Text", extensions: ["txt"] }],
  });
}
