import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded border font-medium transition",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
        variant === "primary" &&
          "bg-blue-600 border-blue-600 text-white hover:bg-blue-500",
        variant === "secondary" &&
          "bg-panel border-border text-gray-200 hover:bg-[#1b1f26]",
        variant === "ghost" &&
          "bg-transparent border-transparent text-gray-300 hover:bg-panel",
        variant === "danger" &&
          "bg-red-600/10 border-red-600/40 text-red-300 hover:bg-red-600/20",
        className,
      )}
    >
      {children}
    </button>
  );
}
