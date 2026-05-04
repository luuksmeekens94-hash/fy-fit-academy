import type { AcademyIntroSection } from "@/lib/academy/types";

type AcademyCourseIntroProps = {
  sections: AcademyIntroSection[];
};

export function AcademyCourseIntro({ sections }: AcademyCourseIntroProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.35fr)] lg:items-start">
      {sections.map((section) => (
        <article key={section.label} className="card-surface rounded-[24px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">{section.label}</p>
          {Array.isArray(section.value) ? (
            <ul className="mt-3 space-y-2.5 text-sm leading-6 text-[var(--ink-soft)]">
              {section.value.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{section.value}</p>
          )}
        </article>
      ))}
    </section>
  );
}
