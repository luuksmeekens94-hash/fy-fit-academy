import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import {
  getModuleProgressForUser,
  getOnboardingProgressForUser,
  getStore,
  getTeamMembers,
  getUserById,
  getVisibleDevelopmentDocuments,
  getVisibleGoals,
} from "@/lib/demo-data";
import { formatDate, getOnboardingCompletion, getStatusTone } from "@/lib/utils";

type TeamDetailPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const viewer = await requireRole(["TEAMLEIDER", "BEHEERDER"]);
  const { userId } = await params;
  const member = getUserById(userId);

  if (!member) {
    notFound();
  }

  if (
    viewer.role === "TEAMLEIDER" &&
    !getTeamMembers(viewer.id).some((entry) => entry.id === member.id)
  ) {
    redirect("/team");
  }

  const store = getStore();
  const goals = getVisibleGoals(viewer.id, member.id);
  const documents = getVisibleDevelopmentDocuments(viewer.id, member.id);
  const moduleProgress = getModuleProgressForUser(member.id);
  const onboarding = getOnboardingCompletion(
    store.onboardingPath.steps,
    getOnboardingProgressForUser(member.id),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teamlid detail"
        title={member.name}
        description={`${member.title} · ${member.location}. Een rustig begeleidersbeeld van onboarding, academy en persoonlijke ontwikkeling.`}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card-surface rounded-[28px] p-5">
          <p className="text-sm font-semibold text-[var(--muted)]">Onboarding</p>
          <p className="mt-4 text-3xl font-semibold text-slate-950">{onboarding}%</p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Afgeronde stappen in het huidige pad.
          </p>
        </div>
        <div className="card-surface rounded-[28px] p-5">
          <p className="text-sm font-semibold text-[var(--muted)]">Modules afgerond</p>
          <p className="mt-4 text-3xl font-semibold text-slate-950">
            {moduleProgress.filter((entry) => entry.status === "AFGEROND").length}
          </p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Modules die zichtbaar zijn afgerond in de academy.
          </p>
        </div>
        <div className="card-surface rounded-[28px] p-5">
          <p className="text-sm font-semibold text-[var(--muted)]">Actieve doelen</p>
          <p className="mt-4 text-3xl font-semibold text-slate-950">
            {goals.filter((goal) => goal.status !== "AFGEROND").length}
          </p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            POP- en ontwikkeldoelen die nu aandacht vragen.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card-surface rounded-[32px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
            Leerdoelen
          </p>
          <div className="mt-6 space-y-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-950">{goal.title}</h2>
                  <StatusBadge label={goal.status} tone={getStatusTone(goal.status)} />
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{goal.description}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                  Doeldatum {formatDate(goal.targetDate)} · bijgewerkt {formatDate(goal.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface rounded-[32px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">
            POP-documenten
          </p>
          <div className="mt-6 space-y-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-950">{document.title}</h2>
                  <StatusBadge
                    label={document.visibility === "PRIVATE" ? "Privé" : "Gedeeld"}
                    tone={document.visibility === "PRIVATE" ? "neutral" : "warning"}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                  {document.description}
                </p>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                  {document.category} · bijgewerkt {formatDate(document.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
