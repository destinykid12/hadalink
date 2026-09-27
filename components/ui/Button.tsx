"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white border border-primary hover:bg-primary-dark active:bg-primary-dark disabled:bg-primary/50",
  secondary:
    "bg-accent text-white border border-accent hover:bg-accent/90 active:bg-accent/90 disabled:opacity-60",
  outline:
    "bg-white text-ink border border-line-strong hover:bg-sand-deep active:bg-sand-deep disabled:opacity-50",
  ghost:
    "bg-transparent text-ink-soft border border-transparent hover:bg-sand-deep hover:text-ink disabled:opacity-50",
  danger:
    "bg-danger-soft text-danger border border-danger/30 hover:bg-danger hover:text-white disabled:opacity-50",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconAfter?: IconName;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", icon, iconAfter, fullWidth, className = "", children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === "lg" ? 20 : 16} /> : null}
      {children}
      {iconAfter ? <Icon name={iconAfter} size={size === "lg" ? 20 : 16} /> : null}
    </button>
  );
});
