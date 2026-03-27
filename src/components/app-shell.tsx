import Link from "next/link";

import { UserMenu } from "@/components/user-menu";
import type { User } from "@/lib/types";

type AppShellProps = {
  user: User;
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 lg:px-6">
        <div className="relative">
          <div className="absolute top-4 right-4 lg:right-8">
            <UserMenu user={user} />
          </div>
          <div className="hero-panel soft-grid rounded-[36px] px-6 py-6 text-[var(--foreground)] lg:px-8">
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-5 pr-24 lg:pr-32">
                  <div className="brand-chip">Fy-fit Academy</div>
                  <div className="accent-line" />
                  <div className="space-y-3">
                    <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-[var(--foreground)] lg:text-6xl">
                      Welkom op jouw persoonlijke omgeving.
                    </h1>
                    <p className="max-w-3xl text-base leading-7 text-[var(--ink-soft)] lg:text-lg">
                      Alles voor leren, onboarding en ontwikkeling staat overzichtelijk bij elkaar. Open je menu rechtsboven om snel naar de juiste omgeving te gaan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 py-6 lg:py-8">
          <div className="relative grid gap-6 lg:grid-cols-[1fr_320px]">
            <main className="space-y-6">{children}</main>
            <aside className="space-y-6">
              <div className="card-surface rounded-[28px] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
                  Actief profiel
                </p>
                <h2 className="mt-3 text-xl font-semibold text-slate-950">{user.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{user.bio}</p>
                <div className="mt-5 space-y-3 text-sm text-[var(--ink-soft)]">
                  <p>
                    <span className="font-semibold text-slate-950">Rol:</span> {user.role}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">Locatie:</span> {user.location}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">E-mail:</span> {user.email}
                  </p>
                </div>
              </div>
              <div className="card-surface rounded-[28px] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand)]">
                  Ritme
                </p>
                <div className="mt-4 space-y-4 text-sm leading-6 text-[var(--ink-soft)]">
                  <p>Deze MVP schuift weg van dashboard-drukte en voelt meer als een merkgebonden leercanvas.</p>
                  <p>
                    Klaar voor uitbreiding naar echte data: routes, rollen en domeinmodellen staan onder de huid al stevig.
                  </p>
                  {user.role === "BEHEERDER" ? (
                    <Link
                      href="/admin"
                      className="inline-flex rounded-full bg-[var(--brand)] px-4 py-2 font-semibold text-white transition hover:opacity-90"
                    >
                      Bekijk beheer
                    </Link>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
