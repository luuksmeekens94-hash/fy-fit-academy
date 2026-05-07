import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  label: string;
  tone?: "brand" | "warning" | "success" | "neutral";
};

const toneClasses = {
  brand: "bg-[var(--brand-soft)] text-[var(--brand-deep)]",
  warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
  success: "bg-[var(--success-soft)] text-[var(--success)]",
  neutral: "bg-white/70 text-[var(--ink-muted)] ring-1 ring-[var(--border)]",
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold tracking-[0.08em]",
        toneClasses[tone],
      )}
    >
      {label}
    </span>
  );
}
