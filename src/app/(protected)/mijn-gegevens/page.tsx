import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { initials } from "@/lib/utils";

export default async function MijnGegevensPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mijn gegevens"
        title="Profiel en account"
        description="Een rustige plek voor je basisgegevens, contactinformatie en profielcontext binnen de Fy-fit Academy."
      />

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="card-surface rounded-[32px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
            Profiel
          </p>
          <div className="mt-5 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand-soft)] text-2xl font-semibold text-[var(--brand)]">
              {initials(user.name)}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">{user.name}</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{user.title}</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-[var(--ink-soft)]">
            Hier is ruimte voor een toekomstige profielfoto, aanvullende contactinformatie en persoonlijke voorkeuren.
          </p>
        </div>

        <div className="card-surface rounded-[32px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">
            Basisgegevens
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Naam
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{user.name}</p>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                E-mailadres
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{user.email}</p>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Rol
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{user.role}</p>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Locatie
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{user.location}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[var(--border)] bg-white/85 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Korte profieltekst
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{user.bio}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
