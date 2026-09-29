import { cn } from "@/lib/cn";

export type ProgressProps = {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  showValue?: boolean;
};

export function Progress({
  value,
  max = 100,
  label,
  className,
  showValue = false,
}: ProgressProps) {
  const safeMax = max <= 0 ? 100 : max;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percent = Math.round((clamped / safeMax) * 100);

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-3 text-sm">
          {label ? <span className="text-muted">{label}</span> : <span />}
          {showValue ? (
            <span className="text-metric text-foreground">{percent}%</span>
          ) : null}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clamped}
        aria-label={label ?? "Progress"}
        aria-valuetext={`${percent}%`}
        className="h-1.5 w-full overflow-hidden rounded-sm bg-border-subtle"
      >
        <div
          className="h-full rounded-sm bg-primary transition-[width] duration-[var(--duration-normal)] ease-[var(--ease-out)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
