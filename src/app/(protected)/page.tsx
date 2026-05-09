import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getMyAcademyCourses } from "@/lib/academy/queries";
import {
  canManageAcademy,
  canMonitorOwnTeam,
  canMonitorPractice,
  canOpenTeamRoutes,
  canReviewAccreditation,
  canUsePersonalDevelopment,
  canUsePersonalLms,
  getDashboardLabel,
} from "@/lib/roles";
import {
  getActiveOnboardingPath,
  getModuleProgressForUser,
  getTeamMembers,
  getVisibleDevelopmentDocuments,
  getVisibleGoals,
  getUserById,
  listModules,
  listUsers,
  getOnboardingProgressForUser,
} from "@/lib/data";
import { formatDate, getOnboardingCompletion, getStatusTone } from "@/lib/utils";
import type { Role } from "@/lib/types";

function getDashboardCopy(role: Role, firstName: string) {
  if (role === "PRAKTIJKMANAGER") {
    return {
      eyebrow: "Praktijkmonitor",
      title: "Praktijkoverzicht",
      description: "Een rustig overzicht van onboarding, voortgang en ontwikkelsignalen binnen de praktijk, zonder persoonlijke LMS-flow.",
    };
  }

  if (role === "PRAKTIJKHOUDER") {
    return {
      eyebrow: "Praktijkdashboard",
      title: `Goed om je te zien, ${firstName}`,
      description: "Combineer je eigen Academy-leerpad met een praktijkbreed monitorbeeld voor teams, onboarding en borging.",
    };
  }

  if (role === "BEHEERDER") {
    return {
      eyebrow: "Cockpit",
      title: "Academy- en praktijkcockpit",
      description: "Beheer de leeromgeving en houd praktijkbreed zicht op voortgang, onboarding en ontwikkelondersteuning.",
    };
  }

  if (role === "REVIEWER") {
    return {
      eyebrow: "Accreditatie-preview",
      title: "Revieweromgeving",
      description: "Bekijk LMS-inhoud en accreditatiecontext veilig, zonder voortgang, toetspogingen of certificaten te muteren.",
    };
  }

  if (role === "TEAMLEIDER") {
    return {
      eyebrow: "Dashboard",
      title: `Goed om je te zien, ${firstName}`,
      description: "Hier staat jouw persoonlijke leeromgeving met daarnaast een compact teamblok voor begeleiding.",
    };
  }

  return {
    eyebrow: "Dashboard",
    title: `Goed om je te zien, ${firstName}`,
    description: "Hieronder staat jouw persoonlijke dashboard met je openstaande modules, leerdoelen, onboardingvoortgang en snelle vervolgstappen.",
  };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const hasPersonalLms = canUsePersonalLms(user.role);
  const hasPersonalDevelopment = canUsePersonalDevelopment(user.role);
  const hasOwnTeamMonitor = canMonitorOwnTeam(user.role);
  const hasPracticeMonitor = canMonitorPractice(user.role);
  const hasTeamAccess = canOpenTeamRoutes(user.role);
  const hasAcademyManagement = canManageAcademy(user.role);
  const hasAccreditationReview = canReviewAccreditation(user.role);
  const dashboardCopy = getDashboardCopy(user.role, user.name.split(" ")[0]);
  const [
    modules,
    onboardingPath,
    onboardingProgress,
    developmentDocuments,
    goals,
    academyCourses,
  ] = await Promise.all([
    listModules({ publishedOnly: true }),
    getActiveOnboardingPath(),
    getOnboardingProgressForUser(user.id),
    getVisibleDevelopmentDocuments(user.id, user.id),
    getVisibleGoals(user.id, user.id),
    hasPersonalLms ? getMyAcademyCourses(user.id) : Promise.resolve([]),
  ]);
  const openAcademyCourses = academyCourses.filter((course) => course.status !== "COMPLETED");
  const onboardingCompletion = getOnboardingCompletion(onboardingPath?.steps ?? [], onboardingProgress);
  const teamMembers = hasPracticeMonitor
    ? (await listUsers()).filter(
        (entry) => entry.isActive && entry.id !== user.id && entry.role !== "BEHEERDER" && entry.role !== "REVIEWER",
      )
    : hasOwnTeamMonitor
      ? await getTeamMembers(user.id)
      : [];
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
        eyebrow={dashboardCopy.eyebrow}
        title={dashboardCopy.title}
        description={dashboardCopy.description}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label={hasPersonalLms ? "Openstaande e-learnings" : hasAccreditationReview ? "Previewmodus" : "Praktijkleden in beeld"}
          value={hasPersonalLms ? String(openAcademyCourses.length) : hasAccreditationReview ? "Veilig" : String(teamMembers.length)}
          detail={hasPersonalLms ? "Nog te starten of af te ronden binnen jouw Academy-leerpad." : hasAccreditationReview ? "Reviewerweergave muteert geen voortgang of certificaten." : "Actieve collega’s zichtbaar in de praktijkmonitor."}
        />
        <StatCard
          label={hasPersonalDevelopment ? "Actieve leerdoelen" : hasAcademyManagement ? "Academybeheer" : "Monitorrol"}
          value={hasPersonalDevelopment ? String(goals.filter((goal) => goal.status !== "AFGEROND").length) : hasAcademyManagement ? "Actief" : getDashboardLabel(user.role)}
          detail={hasPersonalDevelopment ? "Focusdoelen die je nu in je POP of kwartaalontwikkeling hebt staan." : hasAcademyManagement ? "Beheer loopt via Admin en LMS cockpit." : "Deze rol richt zich op overzicht in plaats van persoonlijke ontwikkelmap."}
        />
        <StatCard
          label={hasPersonalDevelopment && user.isOnboarding ? "Onboarding voortgang" : hasPersonalDevelopment ? "Ontwikkeldocumenten" : "Onboarding in praktijk"}
          value={hasPersonalDevelopment && user.isOnboarding ? `${onboardingCompletion}%` : hasPersonalDevelopment ? String(developmentDocuments.length) : String(teamSnapshots.filter((entry) => entry.member.isOnboarding).length)}
          detail={
            hasPersonalDevelopment && user.isOnboarding
              ? "Percentage afgeronde stappen in je huidige inwerkpad."
              : hasPersonalDevelopment
                ? "Documenten, notities en POP-items in je ontwikkelomgeving."
                : "Aantal collega’s met een actief inwerkpad in dit basisbeeld."
          }
        />
      </section>

      <section className="card-surface rounded-[28px] border border-[var(--brand)]/20 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">Praktijkbreed</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Mededelingen en deadlines</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">
              Centrale plek voor gespreksperiodes, deadlines voor doelen en andere korte praktijkupdates.
            </p>
          </div>
          <StatusBadge label="Nieuw" tone="brand" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { title: "Gespreksronde", text: "Plan functionerings- en profielgesprekken in de afgesproken periode." },
            { title: "Doelen aanleveren", text: "Werk je SMART-doelen bij voordat je gesprek plaatsvindt." },
            { title: "Kennis delen", text: "Nieuwe externe cursusmaterialen kunnen in de bibliotheek worden gebundeld." },
          ].map((item) => (
            <div key={item.title} className="rounded-[22px] bg-white/85 p-4">
              <h3 className="font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {hasPersonalDevelopment ? (
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
              { href: "/academy", title: "Academy", text: "Werk verder aan je e-learnings en toetsmomenten." },
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
      ) : null}

      {hasPersonalLms || hasPersonalDevelopment ? (
        <section className="grid gap-6 lg:grid-cols-2">
        {hasPersonalLms ? (
        <div className="card-surface rounded-[32px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
                Academy
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Jouw openstaande e-learnings
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
            {openAcademyCourses.slice(0, 3).map((course) => {
              return (
                <Link
                  key={course.id}
                  href={course.href}
                  className="block rounded-[24px] border border-[var(--border)] bg-white/85 p-5 transition hover:border-[var(--brand)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-950">{course.title}</h3>
                    <StatusBadge
                      label={course.status}
                      tone={course.status === "COMPLETED" ? "success" : course.status === "IN_PROGRESS" ? "warning" : "neutral"}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                    {course.description}
                  </p>
                  <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                    {course.assignmentLabel} · {course.studyLoadMinutes} minuten · {course.progressLabel}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
        ) : null}

        {hasPersonalDevelopment ? (
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
        ) : null}
        </section>
      ) : null}

      {hasTeamAccess ? (
        <section className="card-surface rounded-[32px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
                {hasPracticeMonitor ? "Praktijkmonitor" : "Teambeeld"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {hasPracticeMonitor ? "Praktijkbrede basis monitoring" : "Basis monitoring voor begeleiders"}
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
