import Link from "next/link";

import {
  archivePracticeAnnouncementAction,
  publishPracticeAnnouncementAction,
  savePracticeAnnouncementAction,
} from "@/app/praktijkbeheer/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { getVisibleGoals, listDocuments, listUsers } from "@/lib/data";
import { buildPracticeManagementOverview } from "@/lib/practice-management";
import { prisma } from "@/lib/prisma";

const planningSteps = [
  "Aanleiding scherp",
  "Eigenaar gekozen",
  "Datum geprikt",
  "Document gekoppeld",
  "Opvolging vastgelegd",
];

export default async function PracticeManagementPage() {
  const user = await requireRole(["PRAKTIJKMANAGER", "PRAKTIJKHOUDER", "BEHEERDER"]);
  const [users, documents, announcements] = await Promise.all([
    listUsers(),
    listDocuments(),
    prisma.announcement.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 6,
      include: {
        createdBy: { select: { name: true } },
        publishedBy: { select: { name: true } },
      },
    }),
  ]);
  const managedUsers = users.filter(
    (entry) => entry.isActive && entry.id !== user.id && entry.role !== "BEHEERDER" && entry.role !== "REVIEWER",
  );
  const goals = (
    await Promise.all(managedUsers.map((member) => getVisibleGoals(user.id, member.id)))
  ).flat();
  const overview = buildPracticeManagementOverview({ users, documents, goals });

  const overdueGoals = goals.filter((goal) => goal.status !== "AFGEROND" && goal.targetDate).slice(0, 5);
  const unpublishedDocuments = documents.filter((document) => !document.isPublished).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Praktijkbeheer"
        title="Operationele cockpit voor planning, deadlines en communicatie"
        description="Voor praktijkmanager en praktijkbrede rollen: beheer de werkstroom rond mededelingen, gesprekken, deadlines, documenten en rapportage zonder persoonlijke LMS-laag."
      />

      <section className="academy-gradient-panel brand-mark-surface rounded-[34px] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)] lg:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] xl:items-end">
          <div className="max-w-4xl">
            <div className="mb-5 flex flex-wrap gap-2">
              <StatusBadge label="Vandaag sturen" tone="brand" />
              <StatusBadge label={`${overview.metrics.openDevelopmentGoals} open ontwikkeldoelen`} tone="warning" />
              <StatusBadge label={`${overview.metrics.onboardingMembers} onboarding`} tone="success" />
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 lg:text-4xl">
              Eén plek voor alles wat anders tussen appjes, overleg en losse documenten valt.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--ink-soft)]">
              De cockpit helpt om praktijkupdates, POP-deadlines, gespreksmomenten en borgingsdocumenten praktisch te organiseren. Nog niet als zware HR-suite — wel als strak stuurpaneel.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-deep)]">Focus deze week</p>
            <div className="mt-4 space-y-3">
              {planningSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.metricCards.map((metric) => (
          <div key={metric.label} className="card-surface rounded-[28px] p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
              {metric.label}
            </p>
            <p className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950">{metric.value}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{metric.detail}</p>
          </div>
        ))}
      </section>

      <section className="card-surface rounded-[30px] p-3">
        <div className="grid gap-2 md:grid-cols-5">
          {overview.workflows.map((workflow) => (
            <a
              key={workflow.key}
              href={workflow.href}
              className="group rounded-[24px] border border-transparent p-4 transition hover:border-[var(--brand)] hover:bg-white/80"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)] shadow-[0_0_0_5px_rgba(223,130,28,0.14)]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{workflow.status}</span>
              </div>
              <h2 className="text-base font-semibold text-slate-950">{workflow.title}</h2>
              <p className="mt-2 min-h-16 text-sm leading-6 text-[var(--ink-soft)]">{workflow.description}</p>
              <p className="mt-4 text-sm font-semibold text-[var(--brand-deep)] transition group-hover:translate-x-1">
                {workflow.cta} →
              </p>
            </a>
          ))}
        </div>
      </section>

      <section id="mededelingen" className="card-surface overflow-hidden rounded-[34px]">
        <div className="grid lg:grid-cols-[0.86fr_1.14fr]">
          <div className="bg-[var(--brand-soft)]/65 p-6 lg:p-7">
            <StatusBadge label="Mededelingen" tone="brand" />
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Praktijkupdate voorbereiden</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
              Zet updates om naar concrete actie: wie moet wat weten, wanneer moet het af zijn en waar staat het bronbestand?
            </p>
            <div className="mt-6 rounded-[24px] border border-white/70 bg-white/70 p-4">
              <p className="text-sm font-semibold text-slate-950">Publicatiecheck</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                Concepten blijven veilig intern. Publiceren maakt direct role/doelgroep-notificaties aan en toont de update in Nieuws & signalen.
              </p>
            </div>
          </div>
          <form action={savePracticeAnnouncementAction} className="grid gap-3 p-6 md:grid-cols-2 lg:p-7">
            <input
              name="title"
              placeholder="Titel mededeling"
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
              required
            />
            <select
              name="priority"
              defaultValue="INFO"
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
            >
              <option value="INFO">Normale update</option>
              <option value="IMPORTANT">Belangrijk</option>
              <option value="URGENT">Urgent / actie nodig</option>
            </select>
            <select
              name="targetAudienceProfiles"
              defaultValue=""
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
            >
              <option value="">Iedereen</option>
              <option value="FYSIOTHERAPEUT">Fysiotherapeuten</option>
              <option value="PRAKTIJKONDERSTEUNER">Praktijkondersteuning</option>
              <option value="FITCOACH">Fitcoaches</option>
            </select>
            <select
              name="targetRoles"
              defaultValue=""
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
            >
              <option value="">Alle rollen</option>
              <option value="MEDEWERKER">Medewerkers</option>
              <option value="TEAMLEIDER">Teamleiders</option>
              <option value="PRAKTIJKMANAGER">Praktijkmanagers</option>
              <option value="PRAKTIJKHOUDER">Praktijkhouders</option>
            </select>
            <input type="date" name="expiresAt" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
            <input type="hidden" name="visibleToAll" value="true" />
            <textarea
              rows={5}
              name="body"
              placeholder="Kernboodschap, actie en waar het team meer informatie vindt"
              className="md:col-span-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
              required
            />
            <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-3">
              <button
                type="submit"
                name="intent"
                value="draft"
                className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-[var(--brand)]"
              >
                Concept opslaan
              </button>
              <button
                type="submit"
                name="intent"
                value="publish"
                className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--brand-deep)]"
              >
                Publiceren + melden
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="card-surface rounded-[32px] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <StatusBadge label="Publicatieflow" tone="brand" />
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-950">Recente praktijkmededelingen</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              Concepten, live updates en archief staan nu echt in de database. Publiceren maakt meldingen aan voor de gekozen doelgroep.
            </p>
          </div>
          <a href="#mededelingen" className="rounded-full border border-[var(--border)] bg-white/75 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-[var(--brand)]">
            Nieuwe mededeling
          </a>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {announcements.length ? announcements.map((announcement) => (
            <article key={announcement.id} className="rounded-[24px] border border-[var(--border)] bg-white/85 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{announcement.title}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {announcement.createdBy.name} · {announcement.createdAt.toLocaleDateString("nl-NL")}
                  </p>
                </div>
                <StatusBadge
                  label={announcement.status === "PUBLISHED" ? "Live" : announcement.status === "ARCHIVED" ? "Archief" : "Concept"}
                  tone={announcement.status === "PUBLISHED" ? "success" : announcement.status === "ARCHIVED" ? "neutral" : "warning"}
                />
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--ink-soft)]">{announcement.body}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                <span>{announcement.priority}</span>
                <span>·</span>
                <span>{announcement.visibleToAll ? "Iedereen" : "Gericht"}</span>
                {announcement.publishedBy ? <span>· gepubliceerd door {announcement.publishedBy.name}</span> : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {announcement.status !== "PUBLISHED" ? (
                  <form action={publishPracticeAnnouncementAction.bind(null, announcement.id)}>
                    <button className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]">
                      Publiceren
                    </button>
                  </form>
                ) : null}
                {announcement.status !== "ARCHIVED" ? (
                  <form action={archivePracticeAnnouncementAction.bind(null, announcement.id)}>
                    <button className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-[var(--brand)]">
                      Archiveren
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          )) : (
            <p className="rounded-[24px] bg-white/80 p-5 text-sm text-[var(--ink-soft)]">
              Nog geen mededelingen opgeslagen. Maak hierboven het eerste concept of publiceer direct naar Nieuws & signalen.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div id="deadlines" className="card-surface rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <StatusBadge label="Deadlines" tone="warning" />
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-950">Deadlinebord</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                Managementlaag voor open ontwikkeldoelen met streefdatum. Inhoudelijke begeleiding blijft in het medewerkerdetail.
              </p>
            </div>
            <Link href="/team?focus=deadlines" className="rounded-full border border-[var(--border)] bg-white/75 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-[var(--brand)]">
              Naar team
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {overdueGoals.length ? overdueGoals.map((goal) => (
              <div key={goal.id} className="rounded-[22px] border border-[var(--border)] bg-white/85 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-950">{goal.title}</p>
                  <StatusBadge label={goal.status} tone="neutral" />
                </div>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">Streefdatum {goal.targetDate}</p>
              </div>
            )) : (
              <p className="rounded-[22px] bg-white/80 p-4 text-sm text-[var(--ink-soft)]">Geen open doelen met streefdatum gevonden.</p>
            )}
          </div>
        </div>

        <div id="gesprekken" className="card-surface rounded-[32px] p-6">
          <StatusBadge label="Gespreksplanning" tone="success" />
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-950">Gesprekken plannen zonder HR-zwaar gevoel</h2>
          <div className="mt-5 grid gap-3 rounded-[28px] bg-[var(--teal-soft)] p-5">
            <select defaultValue="POP-gesprek" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]">
              <option>POP-gesprek</option>
              <option>Onboardingcheck</option>
              <option>Voortgangsgesprek</option>
              <option>Protocol-/kwaliteitscheck</option>
            </select>
            <div className="grid gap-3 md:grid-cols-2">
              <input type="date" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" />
              <input placeholder="Voorbereiding / documentlink" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" />
            </div>
            <textarea rows={4} placeholder="Agenda: wat bespreken, welke actie, welk bewijs/document hoort erbij?" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" />
            <p className="text-xs leading-5 text-[var(--ink-soft)]">
              Opslaan en kalenderkoppeling kunnen later op dezelfde structuur worden aangesloten.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div id="rapportage" className="card-surface rounded-[32px] p-6">
          <StatusBadge label="Rapportage/export" tone="brand" />
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-950">Managementsamenvatting</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            Gebruik deze ingangen voor overleg met Sjoerd/praktijkleiding: praktijkvoortgang, bibliotheekborging en werkafspraken.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {overview.exportLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-[24px] border border-[var(--border)] bg-white/85 p-4 transition hover:-translate-y-0.5 hover:border-[var(--brand)]">
                <p className="font-semibold text-slate-950">{link.label}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div id="bibliotheek" className="card-surface rounded-[32px] p-6">
          <StatusBadge label="Bibliotheekbeheer" tone="neutral" />
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-950">Documenten die aandacht vragen</h2>
          <div className="mt-5 space-y-3">
            {unpublishedDocuments.length ? unpublishedDocuments.map((document) => (
              <Link key={document.id} href={`/bibliotheek/${document.id}`} className="block rounded-[22px] border border-[var(--border)] bg-white/85 p-4 transition hover:border-[var(--brand)]">
                <p className="font-semibold text-slate-950">{document.title}</p>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">{document.type} · versie {document.version} · nog niet gepubliceerd</p>
              </Link>
            )) : (
              <p className="rounded-[22px] bg-white/80 p-4 text-sm text-[var(--ink-soft)]">Geen ongepubliceerde bibliotheekitems gevonden.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
