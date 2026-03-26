import { notFound } from "next/navigation";

import { toggleModuleProgressAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { QuizCard } from "@/components/quiz-card";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getModuleById, getModuleProgressForUser, getStore } from "@/lib/demo-data";
import { getStatusTone } from "@/lib/utils";

type ModuleDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ModuleDetailPage({ params }: ModuleDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const store = getStore();
  const academyModule = getModuleById(id);

  if (!academyModule) {
    notFound();
  }

  const progress = getModuleProgressForUser(user.id).find(
    (entry) => entry.moduleId === academyModule.id,
  );
  const category = store.categories.find((entry) => entry.id === academyModule.categoryId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={category?.name}
        title={academyModule.title}
        description={academyModule.description}
      />

      <section className="card-surface rounded-[32px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge
              label={progress?.status ?? "NIET_GESTART"}
              tone={getStatusTone(progress?.status ?? "NIET_GESTART")}
            />
            <StatusBadge label={`${academyModule.estimatedMinutes} minuten`} tone="neutral" />
            {academyModule.isRequired ? <StatusBadge label="Verplicht" tone="brand" /> : null}
          </div>
          <form action={toggleModuleProgressAction}>
            <input type="hidden" name="moduleId" value={academyModule.id} />
            <button
              type="submit"
              className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
            >
              {progress?.status === "AFGEROND" ? "Zet terug naar bezig" : "Markeer als afgerond"}
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-5">
        {academyModule.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <div key={section.id} className="card-surface rounded-[32px] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">
                {section.type}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">{section.title}</h2>
              {section.type === "QUIZ" && section.quizData ? (
                <div className="mt-5">
                  <QuizCard questions={section.quizData} />
                </div>
              ) : (
                <p className="mt-4 text-base leading-8 text-[var(--ink-soft)]">
                  {section.content}
                </p>
              )}
            </div>
          ))}
      </section>
    </div>
  );
}
