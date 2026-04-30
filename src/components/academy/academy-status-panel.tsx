import { cn } from "@/lib/utils";

type AcademyStatusPanelProps = {
  title: string;
  message: string;
  tone?: "success" | "warning" | "neutral";
};

const toneClasses: Record<NonNullable<AcademyStatusPanelProps["tone"]>, string> = {
  success: "border-[var(--success)]/20 bg-[var(--success-soft)] text-[var(--success)]",
  warning: "border-[var(--warning)]/20 bg-[var(--warning-soft)] text-[var(--warning)]",
  neutral: "border-[var(--border)] bg-slate-50 text-[var(--ink-soft)]",
};

export function AcademyStatusPanel({
  title,
  message,
  tone = "neutral",
}: AcademyStatusPanelProps) {
  return (
    <section
      className={cn(
        "rounded-[28px] border px-5 py-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.28)]",
        toneClasses[tone],
      )}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.18em]">Status</p>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6">{message}</p>
    </section>
  );
}
