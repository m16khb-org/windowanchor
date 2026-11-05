import * as React from "react";
import {
  Badge as FluentBadge,
  Button as FluentButton,
  Divider,
  Switch as FluentSwitch,
} from "@fluentui/react-components";
import { cn } from "../lib/utils";

const AnyButton = FluentButton as unknown as React.ComponentType<any>;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "icon";
};

const appearance = {
  primary: "primary",
  secondary: "secondary",
  ghost: "subtle",
  outline: "outline",
  danger: "secondary",
} as const;

export function Button({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <AnyButton
      appearance={appearance[variant]}
      className={cn(
        size === "sm" && "min-h-7 px-2.5 text-xs",
        size === "icon" && "h-8 min-w-8 w-8 p-0",
        variant === "danger" &&
          "text-[var(--colorPaletteRedForeground1)] hover:text-[var(--colorPaletteRedForeground1)]",
        className,
      )}
      size={size === "md" ? "medium" : "small"}
      {...props}
    />
  );
}

export function IconButton({
  className,
  variant = "ghost",
  size: _size,
  ...props
}: ButtonProps) {
  return (
    <Button
      aria-label={props["aria-label"]}
      className={cn("h-8 min-w-8 w-8 p-0", className)}
      size="icon"
      variant={variant}
      {...props}
    />
  );
}

type SwitchProps = Omit<
  React.ComponentProps<typeof FluentSwitch>,
  "onChange"
> & {
  onCheckedChange?: (checked: boolean) => void;
};

export function Switch({ onCheckedChange, ...props }: SwitchProps) {
  return (
    <FluentSwitch
      onChange={(_, data) => onCheckedChange?.(data.checked)}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  children,
  ...props
}: React.ComponentProps<typeof FluentBadge> & {
  tone?: "neutral" | "amber" | "teal" | "red" | "green" | "warning";
}) {
  const colors = {
    neutral: "subtle",
    amber: "brand",
    teal: "informative",
    red: "danger",
    green: "success",
    warning: "warning",
  } as const;

  return (
    <FluentBadge
      appearance="tint"
      className={className}
      color={colors[tone]}
      size="small"
      {...props}
    >
      {children}
    </FluentBadge>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-panel-2 px-1 font-mono text-[10px] text-muted">
      {children}
    </kbd>
  );
}

export function Separator({ className }: { className?: string }) {
  return <Divider className={cn("my-1", className)} />;
}
