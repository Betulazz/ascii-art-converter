import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import type { AsciiResult, ExportGifRequest, ExportTxtRequest, GifAsciiResult, ImageAsciiRequest } from "../types/ascii";

export async function convertImageToAscii(input: ImageAsciiRequest): Promise<AsciiResult> {
  return invokeCommand<AsciiResult>("convert_image_to_ascii", { input });
}

export async function convertGifToAscii(input: ImageAsciiRequest): Promise<GifAsciiResult> {
  return invokeCommand<GifAsciiResult>("convert_gif_to_ascii", { input });
}

export async function exportAsciiTxt(input: ExportTxtRequest): Promise<string> {
  return invokeCommand<string>("export_ascii_txt", { input });
}

export async function exportAsciiGif(input: ExportGifRequest): Promise<string> {
  return invokeCommand<string>("export_ascii_gif", { input });
}

export async function chooseTxtExportPath(defaultPath: string): Promise<string | null> {
  return save({
    defaultPath,
    filters: [{ name: "Text", extensions: ["txt"] }],
  });
}

export async function chooseGifExportPath(defaultPath: string): Promise<string | null> {
  return save({
    defaultPath,
    filters: [{ name: "GIF", extensions: ["gif"] }],
  });
}

async function invokeCommand<T>(command: string, args: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    if (isMissingTauriInvokeError(error)) {
      throw new Error("Please run this converter in the Tauri desktop app to use image and GIF conversion.");
    }
    throw error;
  }
}

function isMissingTauriInvokeError(error: unknown): boolean {
  return error instanceof TypeError && error.message.includes("reading 'invoke'");
}
