import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getModuleProgressForUser, getStore } from "@/lib/demo-data";
import { getStatusTone } from "@/lib/utils";

type AcademyPageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function AcademyPage({ searchParams }: AcademyPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const store = getStore();
  const query = params.q?.toLowerCase() ?? "";
  const selectedCategory = params.category ?? "all";
  const progressEntries = getModuleProgressForUser(user.id);

  const filteredModules = store.modules.filter((module) => {
    const matchesQuery =
      module.title.toLowerCase().includes(query) ||
      module.description.toLowerCase().includes(query);
    const matchesCategory =
      selectedCategory === "all" || module.categoryId === selectedCategory;
    return matchesQuery && matchesCategory && module.status === "GEPUBLICEERD";
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academy"
        title="Leren in het ritme van de praktijk"
        description="Modules zijn gegroepeerd per thema en laten voortgang, tijdsinschatting en urgentie in één oogopslag zien."
      />

      <section className="card-surface rounded-[32px] p-6">
        <form className="grid gap-4 lg:grid-cols-[1fr_240px_140px]">
          <input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Zoek op titel of beschrijving"
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
          />
          <select
            name="category"
            defaultValue={selectedCategory}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
          >
            <option value="all">Alle categorieen</option>
            {store.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
          >
            Filteren
          </button>
        </form>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {filteredModules.map((module) => {
          const category = store.categories.find((entry) => entry.id === module.categoryId);
          const progress = progressEntries.find((entry) => entry.moduleId === module.id);

          return (
            <Link
              key={module.id}
              href={`/academy/${module.id}`}
              className="card-surface rounded-[32px] p-6 transition hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
                    {category?.name}
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                    {module.title}
                  </h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand-deep)]">
                  {module.thumbnailLabel}
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                {module.description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <StatusBadge
                  label={progress?.status ?? "NIET_GESTART"}
                  tone={getStatusTone(progress?.status ?? "NIET_GESTART")}
                />
                {module.isRequired ? (
                  <StatusBadge label="Verplicht" tone="brand" />
                ) : (
                  <StatusBadge label="Aanbevolen" tone="neutral" />
                )}
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                {module.sections.length} secties · {module.estimatedMinutes} minuten
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
