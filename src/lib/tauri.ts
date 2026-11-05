import { invoke } from "@tauri-apps/api/core";
import { MOCK_DISPLAYS, MOCK_WINDOWS } from "./mock";
import type { Display, WindowInfo, WindowState } from "./types";

export const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export type RestoreTarget = {
  id: number;
  processPath: string;
  processName: string;
  className: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  state: WindowState;
};

export type RestoreResult = {
  restored: number;
  skipped: number;
  failed: Array<{ id: number; reason: string }>;
};

export async function loadDisplays(): Promise<Display[]> {
  if (!isTauri) {
    return MOCK_DISPLAYS;
  }
  return invoke<Display[]>("list_displays");
}

export async function loadWindows(): Promise<WindowInfo[]> {
  if (!isTauri) {
    return MOCK_WINDOWS;
  }
  return invoke<WindowInfo[]>("list_windows");
}

export async function restoreWindows(
  targets: RestoreTarget[],
): Promise<RestoreResult | null> {
  if (!isTauri) {
    return null;
  }
  return invoke<RestoreResult>("restore_windows", { targets });
}

export async function loadAppInfo(): Promise<{
  name: string;
  version: string;
  platform: string;
  arch: string;
} | null> {
  if (!isTauri) {
    return null;
  }
  return invoke("app_info");
}
