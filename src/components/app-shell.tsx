import Link from "next/link";

import { logoutAction } from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import { NavLink } from "@/components/nav-link";
import { initials } from "@/lib/utils";
import type { User } from "@/lib/types";

type AppShellProps = {
  user: User;
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 lg:px-6">
        <div className="hero-panel soft-grid rounded-[36px] px-6 py-6 text-[var(--foreground)] lg:px-8">
          <BrandMark className="watermark-logo h-32 w-32 text-[var(--brand)]" />
          <div className="relative flex flex-col gap-6">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_340px] lg:items-start">
              <div className="hero-copy space-y-5">
                <div className="brand-chip">Fy-fit Academy MVP</div>
                <div className="accent-line" />
                <div className="space-y-3">
                  <p className="text-lg font-semibold text-[var(--brand)]">Persoonlijke groei en praktijkkennis</p>
                  <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-[var(--foreground)] lg:text-6xl">
                    Een rustige leeromgeving die onboarding en ontwikkeling laat landen
                  </h1>
                  <p className="max-w-3xl text-base leading-8 text-[var(--ink-soft)]">
                    Geen hard LMS-gevoel, maar een zachte, merkvaste omgeving voor modules, bibliotheek, POP en teambegeleiding.
                  </p>
                </div>
              </div>
              <div className="hero-art">
                <div className="diamond-soft right-10 top-3 h-36 w-36" />
                <div className="orb-ring left-6 top-10 h-32 w-32" />
                <div className="glass-orb bottom-5 right-4 h-28 w-28" />
                <BrandMark className="absolute bottom-2 right-2 h-20 w-20 text-[var(--brand)] opacity-20" />
                <div className="frost-panel relative z-10 mt-20 overflow-hidden rounded-[30px] px-5 py-5">
                  <div className="relative flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)] font-semibold text-[var(--brand)]">
                      {initials(user.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-[var(--foreground)]">{user.name}</p>
                      <p className="text-sm text-[var(--ink-soft)]">
                        {user.title} · {user.location}
                      </p>
                    </div>
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]"
                      >
                        Uitloggen
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative flex flex-wrap gap-3">
              <NavLink href="/" label="Dashboard" />
              <NavLink href="/academy" label="Academy" />
              <NavLink href="/bibliotheek" label="Bibliotheek" />
              <NavLink href="/ontwikkeling" label="Mijn Ontwikkeling" />
              {user.isOnboarding || user.role !== "MEDEWERKER" ? (
                <NavLink href="/onboarding" label="Onboarding" />
              ) : null}
              {user.role !== "MEDEWERKER" ? <NavLink href="/team" label="Team" /> : null}
              {user.role === "BEHEERDER" ? <NavLink href="/admin" label="Admin" /> : null}
            </div>
          </div>
        </div>

        <div className="flex-1 py-6 lg:py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
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
