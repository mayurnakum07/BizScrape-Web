import type { ButtonHTMLAttributes, ReactNode } from "react";

import { IconLoader } from "@/components/icons";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "destructive";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-[color:var(--primary-foreground)] hover:bg-primary-hover hover:text-[color:var(--primary-foreground)] active:brightness-95",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-surface-hover active:bg-surface",
  ghost: "bg-transparent text-foreground hover:bg-surface active:bg-surface-hover",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-surface active:bg-surface-hover",
  destructive:
    "bg-error text-error-foreground hover:brightness-110 active:brightness-95",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-[var(--control-h-sm)] px-3 text-sm",
  md: "h-[var(--control-h-md)] px-4 text-sm",
  lg: "h-[var(--control-h-lg)] px-5 text-base",
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium control-press",
    "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary",
    "disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={buttonClassName({ variant, size, className })}
      {...props}
    >
      {loading ? <IconLoader size={size === "sm" ? 14 : 16} /> : leftIcon}
      {children}
      {!loading ? rightIcon : null}
    </button>
  );
}
