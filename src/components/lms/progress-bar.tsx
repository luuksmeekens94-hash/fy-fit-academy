import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  label?: string;
};

export function ProgressBar({ value, label }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm font-medium text-[var(--ink-soft)]">
        <span>{label ?? "Voortgang"}</span>
        <span>{clampedValue}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[var(--brand-soft)]">
        <div
          className={cn(
            "h-full rounded-full bg-[var(--brand)] transition-all",
            clampedValue === 100 ? "bg-[var(--success)]" : "bg-[var(--brand)]",
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
