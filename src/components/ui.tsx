import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:
          "border-amber bg-amber text-canvas shadow-[0_0_0_1px_rgba(245,165,36,0.25)] hover:bg-[#ffb43d]",
        secondary:
          "border-line bg-panel-2 text-text hover:border-line-strong hover:bg-panel-3",
        ghost:
          "border-transparent bg-transparent text-muted hover:bg-panel-2 hover:text-text",
        outline:
          "border-line-strong bg-transparent text-text hover:bg-panel-2",
        danger:
          "border-red/40 bg-red/10 text-red hover:bg-red/20",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export function IconButton({
  className,
  variant = "ghost",
  ...props
}: ButtonProps) {
  return (
    <Button
      aria-label={props["aria-label"]}
      className={cn("h-8 w-8 p-0", className)}
      size="icon"
      variant={variant}
      {...props}
    />
  );
}

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative h-5 w-9 shrink-0 cursor-pointer rounded-full border border-line bg-panel-3 transition-colors data-[state=checked]:border-amber/60 data-[state=checked]:bg-amber",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block h-3.5 w-3.5 translate-x-[3px] rounded-full bg-muted transition-transform data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-canvas" />
    </SwitchPrimitive.Root>
  );
}

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "amber" | "teal" | "red" | "green";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "border-line bg-panel-2 text-muted",
    amber: "border-amber/30 bg-amber/10 text-amber",
    teal: "border-teal/30 bg-teal/10 text-teal",
    red: "border-red/30 bg-red/10 text-red",
    green: "border-green/30 bg-green/10 text-green",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] leading-none tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
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
  return <div className={cn("h-px bg-line", className)} />;
}
