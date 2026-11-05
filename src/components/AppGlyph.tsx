import {
  Chat20Regular,
  Code20Regular,
  Folder20Regular,
  Globe20Regular,
  PaintBrush20Regular,
  WindowConsole20Regular,
} from "@fluentui/react-icons";
import type { ComponentType } from "react";
import { appColor } from "../lib/mock";
import { cn } from "../lib/utils";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "Code.exe": Code20Regular,
  "chrome.exe": Globe20Regular,
  "WindowsTerminal.exe": WindowConsole20Regular,
  "Figma.exe": PaintBrush20Regular,
  "Slack.exe": Chat20Regular,
  "explorer.exe": Folder20Regular,
};

export function AppGlyph({
  processName,
  size = "md",
  className,
}: {
  processName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = ICONS[processName] ?? Globe20Regular;
  const color = appColor(processName);
  const dimensions = {
    sm: "h-6 w-6 rounded",
    md: "h-8 w-8 rounded-md",
    lg: "h-10 w-10 rounded-lg",
  }[size];
  const iconClass = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" }[size];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center border",
        dimensions,
        className,
      )}
      style={{
        backgroundColor: `${color}18`,
        borderColor: `${color}55`,
        color,
      }}
    >
      <Icon className={iconClass} />
    </span>
  );
}

export function appLabel(processName: string) {
  const labels: Record<string, string> = {
    "Code.exe": "Visual Studio Code",
    "chrome.exe": "Google Chrome",
    "WindowsTerminal.exe": "Windows Terminal",
    "Figma.exe": "Figma",
    "Slack.exe": "Slack",
    "explorer.exe": "File Explorer",
  };
  return labels[processName] ?? processName.replace(/\.exe$/i, "");
}
