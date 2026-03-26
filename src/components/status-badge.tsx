import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  label: string;
  tone?: "brand" | "warning" | "success" | "neutral";
};

const toneClasses = {
  brand: "bg-[var(--brand-soft)] text-[var(--brand-deep)]",
  warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
  success: "bg-[var(--success-soft)] text-[var(--success)]",
  neutral: "bg-slate-100 text-slate-700",
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        toneClasses[tone],
      )}
    >
      {label}
    </span>
  );
}
