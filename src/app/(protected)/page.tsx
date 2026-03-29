import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import {
  getActiveOnboardingPath,
  getModuleProgressForUser,
  getTeamMembers,
  getVisibleDevelopmentDocuments,
  getVisibleGoals,
  getUserById,
  listCategories,
  listModules,
  listUsers,
  getOnboardingProgressForUser,
} from "@/lib/data";
import { formatDate, getOnboardingCompletion, getStatusTone } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const [
    modules,
    categories,
    onboardingPath,
    moduleProgress,
    onboardingProgress,
    developmentDocuments,
    goals,
  ] = await Promise.all([
    listModules({ publishedOnly: true }),
    listCategories(),
    getActiveOnboardingPath(),
    getModuleProgressForUser(user.id),
    getOnboardingProgressForUser(user.id),
    getVisibleDevelopmentDocuments(user.id, user.id),
    getVisibleGoals(user.id, user.id),
  ]);
  const openModules = modules.filter((module) => {
    const progress = moduleProgress.find((entry) => entry.moduleId === module.id);
    return !progress || progress.status !== "AFGEROND";
  });
  const onboardingCompletion = getOnboardingCompletion(onboardingPath?.steps ?? [], onboardingProgress);
  const teamMembers =
    user.role === "MEDEWERKER"
      ? []
      : user.role === "BEHEERDER"
        ? (await listUsers()).filter((entry) => entry.role !== "BEHEERDER")
        : await getTeamMembers(user.id);
  const teamSnapshots = await Promise.all(
    teamMembers.map(async (member) => ({
      member,
      moduleProgress: await getModuleProgressForUser(member.id),
      goals: await getVisibleGoals(user.id, member.id),
      buddy: member.buddyId ? await getUserById(member.buddyId) : null,
      onboarding: getOnboardingCompletion(
        onboardingPath?.steps ?? [],
        await getOnboardingProgressForUser(member.id),
      ),
    })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={`Goed om je te zien, ${user.name.split(" ")[0]}`}
        description="Hieronder staat jouw persoonlijke dashboard. Krijg direct inzicht in je openstaande modules, actieve leerdoelen, onboardingvoortgang en de onderdelen waarmee je vandaag verder kunt."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Openstaande modules"
          value={String(openModules.length)}
          detail="Nog te bekijken of af te ronden binnen jouw persoonlijke route."
        />
        <StatCard
          label="Actieve leerdoelen"
          value={String(goals.filter((goal) => goal.status !== "AFGEROND").length)}
          detail="Focusdoelen die je nu in je POP of kwartaalontwikkeling hebt staan."
        />
        <StatCard
          label={user.isOnboarding ? "Onboarding voortgang" : "Ontwikkeldocumenten"}
          value={user.isOnboarding ? `${onboardingCompletion}%` : String(developmentDocuments.length)}
          detail={
            user.isOnboarding
              ? "Percentage afgeronde stappen in je huidige inwerkpad."
              : "Documenten, notities en POP-items in je ontwikkelomgeving."
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="card-surface rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
                Mijn ritme
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Wat staat nu bovenaan
              </h2>
            </div>
            <Link
              href="/ontwikkeling"
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-[var(--brand)]"
            >
              Naar ontwikkeling
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {goals.slice(0, 3).map((goal) => (
              <div
                key={goal.id}
                className="rounded-[24px] border border-[var(--border)] bg-white/90 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-950">{goal.title}</h3>
                  <StatusBadge label={goal.status} tone={getStatusTone(goal.status)} />
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
                  {goal.description}
                </p>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                  Doeldatum {formatDate(goal.targetDate)} · Laatst bijgewerkt {formatDate(goal.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface rounded-[32px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">
            Snel verder
          </p>
          <div className="mt-6 grid gap-4">
            {[
              { href: "/academy", title: "Academy", text: "Werk verder aan je modules en kennistoetsen." },
              { href: "/bibliotheek", title: "Bibliotheek", text: "Pak protocollen, kernboodschappen en formats erbij." },
              { href: "/onboarding", title: "Onboarding", text: "Bekijk je volgende stap en buddy-notities." },
            ]
              .filter((item) => item.href !== "/onboarding" || user.isOnboarding || user.role !== "MEDEWERKER")
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5 transition hover:-translate-y-0.5 hover:border-[var(--brand)]"
                >
                  <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.text}</p>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface rounded-[32px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
                Academy
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Jouw openstaande modules
              </h2>
            </div>
            <Link
              href="/academy"
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-slate-900"
            >
              Alles bekijken
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {openModules.slice(0, 3).map((module) => {
              const progress = moduleProgress.find((entry) => entry.moduleId === module.id);
              const category = categories.find((entry) => entry.id === module.categoryId);

              return (
                <Link
                  key={module.id}
                  href={`/academy/${module.id}`}
                  className="block rounded-[24px] border border-[var(--border)] bg-white/85 p-5 transition hover:border-[var(--brand)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-950">{module.title}</h3>
                    <StatusBadge
                      label={progress?.status ?? "NIET_GESTART"}
                      tone={getStatusTone(progress?.status ?? "NIET_GESTART")}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                    {module.description}
                  </p>
                  <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                    {category?.name} · {module.estimatedMinutes} minuten
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="card-surface rounded-[32px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">
                Ontwikkelmap
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Recente documenten
              </h2>
            </div>
            <Link
              href="/ontwikkeling"
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-slate-900"
            >
              Open map
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {developmentDocuments.slice(0, 3).map((document) => (
              <div
                key={document.id}
                className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-950">{document.title}</h3>
                  <StatusBadge
                    label={document.visibility === "TEAM" ? "Gedeeld met begeleider" : "Privé"}
                    tone={document.visibility === "TEAM" ? "warning" : "neutral"}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                  {document.description}
                </p>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                  {document.category} · Bijgewerkt {formatDate(document.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {user.role !== "MEDEWERKER" ? (
        <section className="card-surface rounded-[32px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
                Teambeeld
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Basis monitoring voor begeleiders
              </h2>
            </div>
            <Link
              href="/team"
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-slate-900"
            >
              Naar teamoverzicht
            </Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {teamSnapshots.map(({ member, moduleProgress: memberProgress, goals: memberGoals, buddy, onboarding: memberOnboarding }) => {
              return (
                <Link
                  key={member.id}
                  href={`/team/${member.id}`}
                  className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5 transition hover:border-[var(--brand)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{member.name}</h3>
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">
                        {member.title} · {member.location}
                      </p>
                    </div>
                    <StatusBadge
                      label={member.isOnboarding ? "Onboarding actief" : "Actief"}
                      tone={member.isOnboarding ? "warning" : "success"}
                    />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-[var(--brand-soft)] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                        Modules
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {memberProgress.filter((entry) => entry.status === "AFGEROND").length}/
                        {modules.length}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--teal-soft)] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
                        Doelen
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {memberGoals.filter((goal) => goal.status !== "AFGEROND").length}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                        Onboarding
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{memberOnboarding}%</p>
                    </div>
                  </div>
                  {buddy ? (
                    <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                      Buddy: {buddy.name}
                    </p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
