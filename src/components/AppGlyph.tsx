import {
  Code2,
  Folder,
  Globe2,
  MessageSquare,
  PenTool,
  SquareTerminal,
  type LucideIcon,
} from "lucide-react";
import { appColor } from "../lib/mock";
import { cn } from "../lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "Code.exe": Code2,
  "chrome.exe": Globe2,
  "WindowsTerminal.exe": SquareTerminal,
  "Figma.exe": PenTool,
  "Slack.exe": MessageSquare,
  "explorer.exe": Folder,
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
  const Icon = ICONS[processName] ?? Globe2;
  const color = appColor(processName);
  const dimensions = {
    sm: "h-6 w-6 rounded",
    md: "h-8 w-8 rounded-md",
    lg: "h-10 w-10 rounded-lg",
  }[size];
  const iconSize = { sm: 13, md: 16, lg: 19 }[size];

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
      <Icon size={iconSize} strokeWidth={1.9} />
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
