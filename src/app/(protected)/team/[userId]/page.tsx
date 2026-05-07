import { notFound, redirect } from "next/navigation";

import { addDevelopmentDocumentAction } from "@/app/actions";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import {
  getActiveOnboardingPath,
  getModuleProgressForUser,
  getOnboardingProgressForUser,
  getTeamMembers,
  getUserById,
  getVisibleDevelopmentDocuments,
  getVisibleGoals,
} from "@/lib/data";
import { formatDate, getOnboardingCompletion, getStatusTone } from "@/lib/utils";

type TeamDetailPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const viewer = await requireRole(["TEAMLEIDER", "BEHEERDER"]);
  const { userId } = await params;
  const member = await getUserById(userId);

  if (!member) {
    notFound();
  }

  if (
    viewer.role === "TEAMLEIDER" &&
    !(await getTeamMembers(viewer.id)).some((entry) => entry.id === member.id)
  ) {
    redirect("/team");
  }

  const [goals, documents, moduleProgress, onboardingPath, onboardingProgress] = await Promise.all([
    getVisibleGoals(viewer.id, member.id),
    getVisibleDevelopmentDocuments(viewer.id, member.id),
    getModuleProgressForUser(member.id),
    getActiveOnboardingPath(),
    getOnboardingProgressForUser(member.id),
  ]);
  const onboarding = getOnboardingCompletion(onboardingPath?.steps ?? [], onboardingProgress);

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
            Documenten en gespreksverslagen
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            Voeg als begeleider beoordelingsgesprekken, functioneringsgesprekken of profielgesprekken toe aan de ontwikkelmap van {member.name.split(" ")[0]}.
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
                    label={document.category}
                    tone={document.visibility === "PRIVATE" ? "neutral" : "warning"}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                  {document.description}
                </p>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                  {document.visibility === "PRIVATE" ? "Privé" : "Gedeeld"} · bijgewerkt {formatDate(document.updatedAt)}
                </p>
              </div>
            ))}
          </div>
          <form action={addDevelopmentDocumentAction} className="mt-6 grid gap-3 rounded-[28px] bg-[var(--teal-soft)] p-5">
            <input type="hidden" name="targetUserId" value={member.id} />
            <h3 className="text-lg font-semibold text-slate-950">Gespreksdocument toevoegen</h3>
            <input
              name="title"
              placeholder="Bijvoorbeeld: Functioneringsgesprek voorjaar 2026"
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]"
              required
            />
            <textarea
              name="description"
              rows={3}
              placeholder="Korte samenvatting, afspraken of verwijzing naar het document."
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]"
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select name="category" defaultValue="Functioneringsgesprek" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]">
                <option value="Beoordelingsgesprek">Beoordelingsgesprek</option>
                <option value="Functioneringsgesprek">Functioneringsgesprek</option>
                <option value="Profielgesprek">Profielgesprek</option>
                <option value="POP">POP</option>
                <option value="Bewijs">Bewijs</option>
              </select>
              <select name="visibility" defaultValue="TEAM" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]">
                <option value="TEAM">Zichtbaar voor medewerker en begeleider</option>
                <option value="PRIVATE">Alleen in dossier medewerker</option>
              </select>
            </div>
            <button type="submit" className="rounded-full bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
              Toevoegen aan ontwikkelmap
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
