type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="space-y-3">
      {eyebrow ? (
        <p className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--teal)] ring-1 ring-[var(--border)]">
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-2">
        <h1 className="display-font max-w-4xl text-3xl font-semibold text-[var(--foreground)] md:text-4xl">
          {title}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-[var(--ink-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}
