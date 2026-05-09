import { PageHeader } from "@/components/page-header";
import { AcademyCourseCard } from "@/components/academy/academy-course-card";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { buildAcademyOverview } from "@/lib/academy/overview";
import { getMyAcademyCourses } from "@/lib/academy/queries";
import { canUsePersonalLms } from "@/lib/roles";
import { redirect } from "next/navigation";

type AcademyPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AcademyPage({ searchParams }: AcademyPageProps) {
  const user = await requireUser();
  if (!canUsePersonalLms(user.role)) {
    redirect("/");
  }

  const params = await searchParams;
  const courses = await getMyAcademyCourses(user.id);
  const overview = buildAcademyOverview(user.audienceProfile, courses, params.q ?? "");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={overview.copy.eyebrow}
        title={overview.copy.title}
        description={overview.copy.description}
      />

      <section className="card-surface overflow-hidden rounded-[28px] p-0">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              {overview.copy.focusTags.map((tag) => (
                <StatusBadge key={tag} label={tag} tone="brand" />
              ))}
            </div>
            <form className="mt-5 grid gap-3 lg:grid-cols-[1fr_132px]">
              <input
                type="search"
                name="q"
                defaultValue={params.q}
                placeholder="Zoek op titel, beschrijving, doel of prioriteit"
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
              />
              <button type="submit" className="btn-primary px-5 py-3 text-sm">
                Filteren
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-px bg-[var(--border)] lg:grid-cols-2">
            {[
              { label: "Beschikbaar", value: overview.stats.total },
              { label: "Bezig", value: overview.stats.inProgress },
              { label: "Afgerond", value: overview.stats.completed },
              { label: "Need to know", value: overview.stats.needToKnow },
            ].map((item) => (
              <div key={item.label} className="bg-white p-4">
                <p className="text-2xl font-semibold text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {overview.sections.length ? (
        <div className="space-y-6">
          {overview.sections.map((section) => (
            <section key={section.id} className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">{section.description}</p>
                </div>
                <StatusBadge label={`${section.courses.length} items`} tone="neutral" />
              </div>
              <div className="grid items-start gap-4 xl:grid-cols-2">
                {section.courses.map((course) => (
                  <AcademyCourseCard key={`${section.id}-${course.id}`} course={course} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="card-surface rounded-[24px] p-6">
          <h2 className="text-xl font-semibold text-slate-950">{overview.emptyState.title}</h2>
          <p className="mt-2 text-base leading-7 text-[var(--ink-soft)]">{overview.emptyState.text}</p>
        </section>
      )}
    </div>
  );
}
