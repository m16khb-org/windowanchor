import { appColor } from "../lib/mock";
import type { Display, WindowInfo } from "../lib/types";

export function MiniMap({
  displays,
  windows,
  accent,
  className,
}: {
  displays: Display[];
  windows: WindowInfo[];
  accent: string;
  className?: string;
}) {
  if (displays.length === 0) {
    return <div className={className} />;
  }

  const minX = Math.min(...displays.map((display) => display.x));
  const minY = Math.min(...displays.map((display) => display.y));
  const maxX = Math.max(...displays.map((display) => display.x + display.width));
  const maxY = Math.max(...displays.map((display) => display.y + display.height));
  const width = maxX - minX;
  const height = maxY - minY;
  const padding = 8;

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox={`${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {displays.map((display) => (
        <rect
          key={display.id}
          fill="none"
          height={display.height}
          rx={12}
          stroke="#2a3d52"
          strokeWidth={6}
          width={display.width}
          x={display.x}
          y={display.y}
        />
      ))}
      {windows.map((window) => {
        const rect = window.visualRect ?? window.rect;
        const color = appColor(window.processName);
        return (
          <rect
            key={window.id}
            fill={color}
            fillOpacity={0.32}
            height={Math.max(rect.height, 40)}
            rx={8}
            stroke={color}
            strokeOpacity={0.7}
            strokeWidth={5}
            width={Math.max(rect.width, 40)}
            x={rect.x}
            y={rect.y}
          />
        );
      })}
      {displays.length > 0 && (
        <rect
          fill={accent}
          fillOpacity={0.9}
          height={10}
          rx={5}
          width={10}
          x={minX + padding}
          y={minY + padding}
        />
      )}
    </svg>
  );
}
