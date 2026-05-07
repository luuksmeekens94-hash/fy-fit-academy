import { addDevelopmentDocumentAction, addLearningGoalAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import {
  getModuleProgressForUser,
  getTeamMembers,
  getVisibleDevelopmentDocuments,
  getVisibleGoals,
  listUsers,
} from "@/lib/data";
import { formatDate, getStatusTone } from "@/lib/utils";

export default async function DevelopmentPage() {
  const user = await requireUser();
  const [goals, documents, moduleProgress, teamMembers] = await Promise.all([
    getVisibleGoals(user.id, user.id),
    getVisibleDevelopmentDocuments(user.id, user.id),
    getModuleProgressForUser(user.id),
    user.role === "MEDEWERKER"
      ? Promise.resolve([])
      : user.role === "BEHEERDER"
        ? listUsers().then((entries) => entries.filter((entry) => entry.role !== "BEHEERDER"))
        : getTeamMembers(user.id),
  ]);
  const teamSnapshots = await Promise.all(
    teamMembers.map(async (member) => ({
      member,
      goals: await getVisibleGoals(user.id, member.id),
      documents: await getVisibleDevelopmentDocuments(user.id, member.id),
    })),
  );
  const gesprekDocumenten = documents.filter((document) =>
    ["Beoordelingsgesprek", "Functioneringsgesprek", "Profielgesprek"].includes(document.category),
  );
  const overigeDocumenten = documents.filter((document) =>
    !["Beoordelingsgesprek", "Functioneringsgesprek", "Profielgesprek"].includes(document.category),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mijn Ontwikkeling"
        title="Persoonlijke doelen, POP en bewijslast"
        description="Deze omgeving is bedoeld voor richting, niet voor administratieve ballast: doelen, documenten en basis monitoring staan logisch bij elkaar."
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="card-surface rounded-[32px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
                Leerdoelen
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Waar wil je zichtbaar in groeien?
              </h2>
            </div>
            <StatusBadge
              label={`${goals.filter((goal) => goal.status !== "AFGEROND").length} actief`}
              tone="warning"
            />
          </div>
          <div className="mt-6 space-y-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-950">{goal.title}</h3>
                  <StatusBadge label={goal.status} tone={getStatusTone(goal.status)} />
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                  {goal.description}
                </p>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                  Doeldatum {formatDate(goal.targetDate)} · bijgewerkt {formatDate(goal.updatedAt)}
                </p>
              </div>
            ))}
          </div>
          <form action={addLearningGoalAction} className="mt-6 grid gap-3 rounded-[28px] bg-[var(--brand-soft)] p-5">
            <h3 className="text-lg font-semibold text-slate-950">Nieuw leerdoel toevoegen</h3>
            <input
              name="title"
              placeholder="Bijvoorbeeld: consulten krachtiger structureren"
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
              required
            />
            <textarea
              name="description"
              placeholder="Maak je doel SMART: Specifiek, Meetbaar, Acceptabel, Realistisch en Tijdgebonden. Bijvoorbeeld: binnen 6 weken in 3 consulten de hulpvraag, samenvatting en vervolgstap expliciet afronden."
              rows={4}
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
              required
            />
            <div className="rounded-2xl border border-[var(--brand)]/20 bg-white/75 px-4 py-3 text-xs leading-5 text-[var(--brand-deep)]">
              <strong>SMART-check:</strong> benoem concreet gedrag, hoe je voortgang zichtbaar wordt, waarom het past, wat haalbaar is en wanneer je het evalueert.
            </div>
            <input
              name="targetDate"
              type="date"
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
            >
              Leerdoel bewaren
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card-surface rounded-[32px] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">
              POP-documenten
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Ontwikkelmap
            </h2>
            <div className="mt-6 space-y-5">
              <div className="rounded-[24px] border border-[var(--teal)]/20 bg-white/75 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-950">Gespreksdocumenten</h3>
                  <StatusBadge label={`${gesprekDocumenten.length} items`} tone="neutral" />
                </div>
                <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">
                  Beoordelingsgesprekken, functioneringsgesprekken en profielgesprekken staan hier apart van POP-notities.
                </p>
                <div className="mt-4 space-y-3">
                  {gesprekDocumenten.length > 0 ? gesprekDocumenten.map((document) => (
                    <div key={document.id} className="rounded-[20px] border border-[var(--border)] bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h4 className="font-semibold text-slate-950">{document.title}</h4>
                        <StatusBadge label={document.category} tone="brand" />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{document.description}</p>
                      <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                        {document.visibility === "PRIVATE" ? "Privé" : "Zichtbaar voor begeleider"} · bijgewerkt {formatDate(document.updatedAt)}
                      </p>
                    </div>
                  )) : (
                    <p className="rounded-[20px] bg-white px-4 py-3 text-sm text-[var(--ink-soft)]">
                      Nog geen gespreksdocumenten toegevoegd.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-semibold text-slate-950">POP, bewijs en reflectie</h3>
                {overigeDocumenten.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-950">{document.title}</h3>
                      <StatusBadge
                        label={document.visibility === "PRIVATE" ? "Privé" : "Zichtbaar voor begeleider"}
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
            <form action={addDevelopmentDocumentAction} className="mt-6 grid gap-3 rounded-[28px] bg-[var(--teal-soft)] p-5">
              <h3 className="text-lg font-semibold text-slate-950">Document toevoegen</h3>
              <input
                name="title"
                placeholder="Bijvoorbeeld: POP Q3 of bewijsmap consultvoering"
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]"
                required
              />
              <textarea
                name="description"
                rows={3}
                placeholder="Korte samenvatting van wat je in dit document bewaart."
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]"
                required
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  name="category"
                  defaultValue="POP"
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]"
                >
                  <option value="POP">POP</option>
                  <option value="Bewijs">Bewijs</option>
                  <option value="Reflectie">Reflectie</option>
                  <option value="Beoordelingsgesprek">Beoordelingsgesprek</option>
                  <option value="Functioneringsgesprek">Functioneringsgesprek</option>
                  <option value="Profielgesprek">Profielgesprek</option>
                </select>
                <select
                  name="visibility"
                  defaultValue="TEAM"
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]"
                >
                  <option value="TEAM">Zichtbaar voor begeleider</option>
                  <option value="PRIVATE">Alleen voor medewerker</option>
                </select>
              </div>
              <button
                type="submit"
                className="rounded-full bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Document toevoegen
              </button>
            </form>
          </div>

          <div className="card-surface rounded-[32px] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
              Monitoring
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Basisbeeld van je voortgang
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] bg-[var(--brand-soft)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                  Actieve doelen
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {goals.filter((goal) => goal.status !== "AFGEROND").length}
                </p>
              </div>
              <div className="rounded-[24px] bg-[var(--teal-soft)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
                  Afgeronde modules
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {moduleProgress.filter((entry) => entry.status === "AFGEROND").length}
                </p>
              </div>
              <div className="rounded-[24px] bg-slate-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  POP-items
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {documents.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {user.role !== "MEDEWERKER" ? (
        <section className="card-surface rounded-[32px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">
            Begeleidersview
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Ontwikkeling van je team in vogelvlucht
          </h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {teamSnapshots.map(({ member, goals: memberGoals, documents: memberDocuments }) => {
              return (
                <div
                  key={member.id}
                  className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-950">{member.name}</h3>
                    <StatusBadge
                      label={`${memberGoals.filter((goal) => goal.status !== "AFGEROND").length} open doelen`}
                      tone="warning"
                    />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                    {member.title} · {member.location}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-[var(--brand-soft)] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                        Doelen
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{memberGoals.length}</p>
                    </div>
                    <div className="rounded-2xl bg-[var(--teal-soft)] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
                        POP
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{memberDocuments.length}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                        Laatste update
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {memberGoals[0] ? formatDate(memberGoals[0].updatedAt) : "Nog leeg"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
