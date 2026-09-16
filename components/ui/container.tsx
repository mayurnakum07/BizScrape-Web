import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type ContainerSize = "narrow" | "default" | "wide";

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  as?: "div" | "section" | "article" | "main";
  size?: ContainerSize;
};

const sizeClasses: Record<ContainerSize, string> = {
  narrow: "max-w-[var(--container-narrow)]",
  default: "max-w-[var(--container-default)]",
  wide: "max-w-[var(--container-wide)]",
};

export function Container({
  as: Comp = "div",
  size = "default",
  className,
  ...props
}: ContainerProps) {
  return (
    <Comp
      className={cn(
        "mx-auto w-full px-[var(--container-pad)]",
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
