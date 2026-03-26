type StatCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="card-surface rounded-[28px] p-5">
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{detail}</p>
    </div>
  );
}
