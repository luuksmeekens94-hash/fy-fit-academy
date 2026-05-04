import type { AcademyIntroSection } from "@/lib/academy/types";

type AcademyCourseIntroProps = {
  sections: AcademyIntroSection[];
};

function isLearningObjectives(section: AcademyIntroSection) {
  return section.label.toLowerCase().includes("leerdoel");
}

function IntroCard({ section, featured = false }: { section: AcademyIntroSection; featured?: boolean }) {
  return (
    <article
      className={
        featured
          ? "academy-info-card academy-info-card--featured h-full p-5 sm:p-6"
          : "academy-info-card p-5"
      }
    >
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
          {section.label}
        </p>
      </div>

      {Array.isArray(section.value) ? (
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-[var(--ink-soft)] sm:grid-cols-2 lg:grid-cols-1">
          {section.value.map((item) => (
            <li key={item} className="flex gap-3 rounded-2xl bg-white/65 px-3 py-2.5 ring-1 ring-black/[0.04]">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)] shadow-[0_0_0_4px_var(--brand-soft)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{section.value}</p>
      )}
    </article>
  );
}

export function AcademyCourseIntro({ sections }: AcademyCourseIntroProps) {
  const learningObjectives = sections.find(isLearningObjectives);
  const supportingSections = sections.filter((section) => !isLearningObjectives(section));

  return (
    <section className="rounded-[34px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(255,253,250,0.92),rgba(246,241,233,0.78))] p-3 shadow-[0_24px_70px_-54px_rgba(35,27,18,0.6)] sm:p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          {supportingSections.map((section) => (
            <IntroCard key={section.label} section={section} />
          ))}
        </div>

        {learningObjectives ? <IntroCard section={learningObjectives} featured /> : null}
      </div>
    </section>
  );
}
