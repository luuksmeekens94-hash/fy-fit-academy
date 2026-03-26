type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="space-y-3">
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--teal)]">
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-2">
        <h1 className="display-font text-4xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-[var(--ink-soft)]">
          {description}
        </p>
      </div>
    </div>
  );
}
