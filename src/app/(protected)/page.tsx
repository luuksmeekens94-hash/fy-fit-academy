import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getMyAcademyCourses } from "@/lib/academy/queries";
import { getAudienceProfileLabel } from "@/lib/audience";
import { getAudienceContextItems } from "@/lib/dashboard-copy";
import { getDashboardRoleFit } from "@/lib/dashboard-role-fit";
import {
  canManageAcademy,
  canMonitorOwnTeam,
  canMonitorPractice,
  canOpenTeamRoutes,
  canReviewAccreditation,
  canUsePersonalDevelopment,
  canUsePersonalLms,
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

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "REVIEWER") {
    redirect("/lms");
  }

  const hasPersonalLms = canUsePersonalLms(user.role);
  const hasPersonalDevelopment = canUsePersonalDevelopment(user.role);
  const hasOwnTeamMonitor = canMonitorOwnTeam(user.role);
  const hasPracticeMonitor = canMonitorPractice(user.role);
  const hasTeamAccess = canOpenTeamRoutes(user.role);
  const hasAcademyManagement = canManageAcademy(user.role);
  const hasAccreditationReview = canReviewAccreditation(user.role);
  const firstName = user.name.split(" ")[0];
  const dashboardRoleFit = getDashboardRoleFit(user.role, firstName, user.audienceProfile);
  const dashboardCopy = dashboardRoleFit.copy;
  const audienceLabel = getAudienceProfileLabel(user.audienceProfile);
  const audienceContextItems = getAudienceContextItems(user.audienceProfile);
  const personalQuickLinks = dashboardRoleFit.primaryLinks.filter((item) =>
    ["/academy", "/ontwikkeling", "/bibliotheek", "/onboarding"].includes(item.href),
  );
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
          label={dashboardRoleFit.primaryStats[0].label}
          value={dashboardRoleFit.primaryMode === "PERSONAL" || (dashboardRoleFit.primaryMode === "TEAM" && hasPersonalLms) ? String(openAcademyCourses.length) : hasAccreditationReview ? "Veilig" : String(teamMembers.length)}
          detail={dashboardRoleFit.primaryStats[0].detail}
        />
        <StatCard
          label={dashboardRoleFit.primaryStats[1].label}
          value={hasPersonalDevelopment ? String(goals.filter((goal) => goal.status !== "AFGEROND").length) : hasAcademyManagement ? "Actief" : dashboardRoleFit.primaryMode === "PRACTICE" ? String(teamSnapshots.filter((entry) => entry.goals.some((goal) => goal.status !== "AFGEROND")).length) : dashboardRoleFit.primaryMode}
          detail={dashboardRoleFit.primaryStats[1].detail}
        />
        <StatCard
          label={dashboardRoleFit.primaryStats[2].label}
          value={
            hasPersonalDevelopment && user.isOnboarding
              ? `${onboardingCompletion}%`
              : hasPersonalDevelopment
                ? String(developmentDocuments.length)
                : String(teamSnapshots.filter((entry) => entry.member.isOnboarding).length)
          }
          detail={dashboardRoleFit.primaryStats[2].detail}
        />
      </section>

      <section className="card-surface rounded-[28px] border border-[var(--brand)]/20 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">Praktijkbreed</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Mededelingen en ontwikkelupdates</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">
              Centrale plek voor gespreksperiodes, ontwikkelmomenten en korte praktijkupdates voor alle medewerkers.
            </p>
          </div>
          <StatusBadge label="Nieuw" tone="brand" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { title: "Gespreksronde", text: "Bereid je ontwikkelgesprek voor met actuele doelen, acties en reflecties." },
            { title: "Doelen bijwerken", text: "Werk je persoonlijke ontwikkeldoelen bij op een moment dat past bij jouw rol." },
            { title: "Kennis delen", text: "Nieuwe leer- en informatiematerialen kunnen in de bibliotheek worden gebundeld." },
          ].map((item) => (
            <div key={item.title} className="rounded-[22px] bg-white/85 p-4">
              <h3 className="font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {dashboardRoleFit.primaryMode === "PRACTICE" ? (
        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="card-surface rounded-[28px] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">Praktijk eerst</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {dashboardRoleFit.primaryLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[22px] border border-[var(--border)] bg-white/85 p-4 transition hover:-translate-y-0.5 hover:border-[var(--brand)]"
                >
                  <h3 className="font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.text}</p>
                </Link>
              ))}
            </div>
          </div>
          {dashboardRoleFit.secondaryLinks.length ? (
            <div className="card-surface rounded-[28px] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">Eigen Academy</p>
              <div className="mt-4 space-y-3">
                {dashboardRoleFit.secondaryLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-[22px] border border-[var(--border)] bg-white/85 p-4 transition hover:border-[var(--teal)]"
                  >
                    <h3 className="font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.text}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {hasPersonalDevelopment ? (
        <section className="card-surface rounded-[28px] border border-[var(--teal)]/20 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">Jouw profiel</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Context voor je leer- en ontwikkelomgeving</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">
                De structuur blijft voor iedereen gelijk; je doelgroep kleurt alleen voorbeelden, accenten en snelle vervolgstappen.
              </p>
            </div>
            <StatusBadge label={audienceLabel} tone="brand" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {audienceContextItems.map((item) => (
              <div key={item.title} className="rounded-[22px] bg-white/85 p-4">
                <h3 className="font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {hasPersonalDevelopment ? (
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="card-surface rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
                Mijn ontwikkeling
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Wat staat nu bovenaan?
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
            {goals.length > 0 ? goals.slice(0, 3).map((goal) => (
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
            )) : (
              <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white/75 p-5">
                <h3 className="text-lg font-semibold text-slate-950">Nog geen ontwikkeldoelen</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                  Start met één persoonlijk doel, actie of reflectie. Je POP blijft vrij en hoeft niet in vaste categorieën.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card-surface rounded-[32px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">
            Snel verder
          </p>
          <div className="mt-6 grid gap-4">
            {personalQuickLinks
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
            {openAcademyCourses.length > 0 ? openAcademyCourses.slice(0, 3).map((course) => {
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
            }) : (
              <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white/75 p-5">
                <h3 className="text-lg font-semibold text-slate-950">Geen openstaande e-learnings</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                  Je bent bij. Gebruik de bibliotheek of je ontwikkelmap om verder te reflecteren.
                </p>
              </div>
            )}
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
              {developmentDocuments.length > 0 ? developmentDocuments.slice(0, 3).map((document) => (
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
              )) : (
                <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white/75 p-5">
                  <h3 className="text-lg font-semibold text-slate-950">Nog geen documenten</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                    Voeg een documenttype toe wanneer je een actie, reflectie of bewijsstuk wilt bewaren.
                  </p>
                </div>
              )}
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
