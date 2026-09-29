import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  rounded?: "sm" | "md" | "lg" | "full";
};

const roundedClasses = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-md",
  full: "rounded-full",
};

export function Skeleton({
  className,
  rounded = "md",
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse motion-skeleton bg-surface-hover",
        roundedClasses[rounded],
        className,
      )}
      {...props}
    />
  );
}
