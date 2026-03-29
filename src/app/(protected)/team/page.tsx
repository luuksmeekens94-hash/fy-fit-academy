import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import {
  getActiveOnboardingPath,
  getModuleProgressForUser,
  getOnboardingProgressForUser,
  getTeamMembers,
  getVisibleGoals,
  listUsers,
  listModules,
} from "@/lib/data";
import { getOnboardingCompletion, getTeamMetricLabel } from "@/lib/utils";

export default async function TeamPage() {
  const user = await requireRole(["TEAMLEIDER", "BEHEERDER"]);
  const [members, onboardingPath, modules] = await Promise.all([
    user.role === "BEHEERDER"
      ? listUsers().then((entries) => entries.filter((entry) => entry.role !== "BEHEERDER"))
      : getTeamMembers(user.id),
    getActiveOnboardingPath(),
    listModules({ publishedOnly: true }),
  ]);
  const memberSnapshots = await Promise.all(
    members.map(async (member) => ({
      member,
      moduleProgress: await getModuleProgressForUser(member.id),
      onboarding: getOnboardingCompletion(
        onboardingPath?.steps ?? [],
        await getOnboardingProgressForUser(member.id),
      ),
      goals: await getVisibleGoals(user.id, member.id),
    })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team"
        title="Begeleiden zonder overcontrole"
        description="Dit overzicht laat basisvoortgang zien op onboarding, modules en persoonlijke ontwikkeling, zonder zware analytics of HR-achtige toon."
      />

      <section className="grid gap-5">
        {memberSnapshots.map(({ member, moduleProgress, onboarding, goals }) => {
          return (
            <Link
              key={member.id}
              href={`/team/${member.id}`}
              className="card-surface rounded-[32px] p-6 transition hover:-translate-y-0.5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-slate-950">{member.name}</h2>
                    <StatusBadge
                      label={getTeamMetricLabel(member)}
                      tone={member.isOnboarding ? "warning" : "success"}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                    {member.title} · {member.location}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[var(--brand-soft)] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                      Modules
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {moduleProgress.filter((entry) => entry.status === "AFGEROND").length}/{modules.length}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[var(--teal-soft)] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
                      Doelen
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {goals.filter((goal) => goal.status !== "AFGEROND").length}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                      Onboarding
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{onboarding}%</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
