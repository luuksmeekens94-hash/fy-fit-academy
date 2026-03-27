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
          <BrandMark className="watermark-logo h-28 w-28 text-[var(--brand)]" />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-5 lg:flex-1">
                <div className="brand-chip">Fy-fit Academy</div>
                <div className="accent-line" />
                <div className="space-y-3">
                  <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-[var(--foreground)] lg:text-6xl">
                    Een rustige leeromgeving die onboarding en ontwikkeling laat landen
                  </h1>
                  <p className="max-w-3xl text-base leading-8 text-[var(--ink-soft)]">
                    Geen hard LMS-gevoel, maar een zachte, merkvaste omgeving voor modules, bibliotheek, POP en teambegeleiding.
                  </p>
                </div>
              </div>
              <div className="frost-panel relative z-10 overflow-hidden rounded-[30px] px-5 py-5 lg:min-w-[320px]">
                <div className="orb-ring right-14 top-0 h-28 w-28" />
                <div className="glass-orb bottom-4 right-0 h-28 w-28" />
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
                      className="cursor-pointer rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
                    >
                      Uitloggen
                    </button>
                  </form>
                </div>
              </div>
            </div>
            <div className="relative flex flex-wrap gap-3">
              <NavLink href="/" label="Dashboard" />
              <NavLink href="/academy" label="Fy-fit Academy" />
              <NavLink href="/ontwikkeling" label="Mijn ontwikkeling" />
              {user.isOnboarding || user.role !== "MEDEWERKER" ? (
                <NavLink href="/onboarding" label="Onboarding" />
              ) : null}
              <NavLink href="/bibliotheek" label="Praktijkbibliotheek" />
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
