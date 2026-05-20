import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import type {
  AsciiResult,
  ExportConsoleRequest,
  ExportGifRequest,
  ExportPngRequest,
  ExportVideoRequest,
  ExportTxtRequest,
  GifAsciiResult,
  ImageAsciiRequest,
  VideoAsciiRequest,
  VideoAsciiResult,
} from "../types/ascii";

export async function convertImageToAscii(input: ImageAsciiRequest): Promise<AsciiResult> {
  return invokeCommand<AsciiResult>("convert_image_to_ascii", { input });
}

export async function convertGifToAscii(input: ImageAsciiRequest): Promise<GifAsciiResult> {
  return invokeCommand<GifAsciiResult>("convert_gif_to_ascii", { input });
}

export async function convertVideoToAscii(input: VideoAsciiRequest): Promise<VideoAsciiResult> {
  return invokeCommand<VideoAsciiResult>("convert_video_to_ascii", { input });
}

export async function exportAsciiTxt(input: ExportTxtRequest): Promise<string> {
  return invokeCommand<string>("export_ascii_txt", { input });
}

export async function exportAsciiGif(input: ExportGifRequest): Promise<string> {
  return invokeCommand<string>("export_ascii_gif", { input });
}

export async function exportAsciiPng(input: ExportPngRequest): Promise<string> {
  return invokeCommand<string>("export_ascii_png", { input });
}

export async function exportAsciiVideo(input: ExportVideoRequest): Promise<string> {
  return invokeCommand<string>("export_ascii_video", { input });
}

export async function exportAsciiConsole(input: ExportConsoleRequest): Promise<string> {
  return invokeCommand<string>("export_ascii_console", { input });
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

export async function choosePngExportPath(defaultPath: string): Promise<string | null> {
  return save({
    defaultPath,
    filters: [{ name: "PNG", extensions: ["png"] }],
  });
}

export async function chooseVideoOpenPath(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    filters: [{ name: "Video", extensions: ["mp4", "webm", "mov", "avi", "mkv"] }],
  });

  return typeof selected === "string" ? selected : null;
}

export async function chooseVideoExportPath(defaultPath: string): Promise<string | null> {
  return save({
    defaultPath,
    filters: [{ name: "MP4", extensions: ["mp4"] }],
  });
}

async function invokeCommand<T>(command: string, args: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    if (isMissingTauriInvokeError(error)) {
      throw new Error("Please run this converter in the Tauri desktop app to use image, GIF, and video conversion.");
    }
    throw error;
  }
}

function isMissingTauriInvokeError(error: unknown): boolean {
  return error instanceof TypeError && error.message.includes("reading 'invoke'");
}
