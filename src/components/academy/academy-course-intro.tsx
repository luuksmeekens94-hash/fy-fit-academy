import type { AcademyIntroSection } from "@/lib/academy/types";

type AcademyCourseIntroProps = {
  sections: AcademyIntroSection[];
};

export function AcademyCourseIntro({ sections }: AcademyCourseIntroProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {sections.map((section) => (
        <article key={section.label} className="card-surface rounded-[28px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">{section.label}</p>
          {Array.isArray(section.value) ? (
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
              {section.value.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[var(--brand)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{section.value}</p>
          )}
        </article>
      ))}
    </section>
  );
}
