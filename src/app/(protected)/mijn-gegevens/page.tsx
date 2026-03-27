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
        description="Hier vind je je basisgegevens en de plek waar later een profielfoto en aanvullende persoonlijke instellingen kunnen worden toegevoegd."
      />

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="card-surface rounded-[32px] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand-soft)] text-2xl font-semibold text-[var(--brand)]">
              {initials(user.name)}
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-[var(--border)] bg-white/90 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
              foto
            </div>
          </div>
          <div className="mt-5">
            <h2 className="text-2xl font-semibold text-slate-950">{user.name}</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              Placeholder voor een latere profielfoto en aanvullende profielgegevens.
            </p>
          </div>
        </div>

        <div className="card-surface rounded-[32px] p-6">
          <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </section>
    </div>
  );
}
