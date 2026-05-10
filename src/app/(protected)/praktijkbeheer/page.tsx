import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { getVisibleGoals, listDocuments, listUsers } from "@/lib/data";
import { buildPracticeManagementOverview } from "@/lib/practice-management";

export default async function PracticeManagementPage() {
  const user = await requireRole(["PRAKTIJKMANAGER", "PRAKTIJKHOUDER", "BEHEERDER"]);
  const [users, documents] = await Promise.all([listUsers(), listDocuments()]);
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.metricCards.map((metric) => (
          <div key={metric.label} className="card-surface rounded-[28px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
              {metric.label}
            </p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{metric.value}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{metric.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-5">
        {overview.workflows.map((workflow) => (
          <a
            key={workflow.key}
            href={workflow.href}
            className="card-surface rounded-[28px] p-5 transition hover:-translate-y-0.5 hover:border-[var(--brand)]"
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge label={workflow.status} tone="neutral" />
            </div>
            <h2 className="text-xl font-semibold text-slate-950">{workflow.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{workflow.description}</p>
            <p className="mt-5 text-sm font-semibold text-[var(--brand-deep)]">{workflow.cta} →</p>
          </a>
        ))}
      </section>

      <section id="mededelingen" className="card-surface rounded-[32px] p-6">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <StatusBadge label="Mededelingen" tone="brand" />
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Praktijkupdate voorbereiden</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
              Gebruik dit als vaste publicatiecheck voordat een update naar het team gaat. Zo blijft de Academy schoon en wordt communicatie niet verstopt in persoonlijke leerflows.
            </p>
          </div>
          <div className="grid gap-3 rounded-[28px] bg-[var(--brand-soft)] p-5 md:grid-cols-2">
            <input placeholder="Titel mededeling" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
            <select defaultValue="Iedereen" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none">
              <option>Iedereen</option>
              <option>Fysiotherapeuten</option>
              <option>Praktijkondersteuning</option>
              <option>Fitcoaches</option>
            </select>
            <input type="date" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
            <input placeholder="Eigenaar / opvolger" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
            <textarea rows={4} placeholder="Kernboodschap, actie en waar het team meer informatie vindt" className="md:col-span-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
            <p className="md:col-span-2 text-xs leading-5 text-[var(--ink-soft)]">
              Conceptflow: nog geen automatische verzending. Gebruik dit scherm om de update scherp te maken en koppel daarna het juiste document of overlegmoment.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div id="deadlines" className="card-surface rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <StatusBadge label="Deadlines" tone="warning" />
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">Deadlinebord</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                Open ontwikkeldoelen met streefdatum staan bovenaan. Dit is de managementlaag; inhoudelijke begeleiding blijft in het medewerkerdetail.
              </p>
            </div>
            <Link href="/team?focus=deadlines" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-slate-900">
              Naar team
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {overdueGoals.length ? overdueGoals.map((goal) => (
              <div key={goal.id} className="rounded-[22px] border border-[var(--border)] bg-white/85 p-4">
                <p className="font-semibold text-slate-950">{goal.title}</p>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">Streefdatum {goal.targetDate} · status {goal.status}</p>
              </div>
            )) : (
              <p className="rounded-[22px] bg-white/80 p-4 text-sm text-[var(--ink-soft)]">Geen open doelen met streefdatum gevonden.</p>
            )}
          </div>
        </div>

        <div id="gesprekken" className="card-surface rounded-[32px] p-6">
          <StatusBadge label="Gespreksplanning" tone="success" />
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Gesprekken plannen zonder HR-zwaar gevoel</h2>
          <div className="mt-5 grid gap-3 rounded-[28px] bg-[var(--teal-soft)] p-5">
            <select defaultValue="POP-gesprek" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none">
              <option>POP-gesprek</option>
              <option>Onboardingcheck</option>
              <option>Voortgangsgesprek</option>
              <option>Protocol-/kwaliteitscheck</option>
            </select>
            <div className="grid gap-3 md:grid-cols-2">
              <input type="date" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
              <input placeholder="Voorbereiding / documentlink" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
            </div>
            <textarea rows={4} placeholder="Agenda: wat bespreken, welke actie, welk bewijs/document hoort erbij?" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
            <p className="text-xs leading-5 text-[var(--ink-soft)]">
              Deze sprint legt de flow en cockpit vast. Opslaan en kalenderkoppeling kunnen later op dezelfde structuur worden aangesloten.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div id="rapportage" className="card-surface rounded-[32px] p-6">
          <StatusBadge label="Rapportage/export" tone="brand" />
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Managementsamenvatting</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            Gebruik deze export-ingangen voor overleg met Sjoerd/praktijkleiding: praktijkvoortgang, bibliotheekborging en werkafspraken.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {overview.exportLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-[24px] border border-[var(--border)] bg-white/85 p-4 transition hover:border-[var(--brand)]">
                <p className="font-semibold text-slate-950">{link.label}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div id="bibliotheek" className="card-surface rounded-[32px] p-6">
          <StatusBadge label="Bibliotheekbeheer" tone="neutral" />
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Documenten die aandacht vragen</h2>
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
