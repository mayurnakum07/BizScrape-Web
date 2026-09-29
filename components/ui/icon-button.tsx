import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: "ghost" | "outline" | "secondary";
  size?: "sm" | "md";
  children: ReactNode;
};

const variantClasses = {
  ghost: "bg-transparent hover:bg-surface active:bg-surface-hover",
  outline:
    "border border-border bg-transparent hover:bg-surface active:bg-surface-hover",
  secondary:
    "border border-border bg-surface hover:bg-surface-hover active:bg-surface",
};

const sizeClasses = {
  sm: "size-8 max-md:size-10",
  md: "size-10",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      label,
      variant = "ghost",
      size = "md",
      className,
      type = "button",
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-foreground control-press",
          "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
