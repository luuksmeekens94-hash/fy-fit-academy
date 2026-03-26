import Link from "next/link";

import { logoutAction } from "@/app/actions";
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
        <div className="hero-panel soft-grid rounded-[36px] px-6 py-6 text-white shadow-[0_24px_80px_rgba(217,93,0,0.24)] lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full bg-white/14 px-4 py-1 text-sm font-medium text-white/88">
                Fy-fit Academy MVP
              </div>
              <div className="space-y-2">
                <h1 className="display-font text-4xl font-semibold tracking-tight lg:text-5xl">
                  Kennis, onboarding en ontwikkeling op een plek
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-white/88 lg:text-base">
                  Een interne demo voor collega&apos;s met routes voor medewerker, teamleider en beheer.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-[28px] bg-white/12 px-4 py-4 backdrop-blur-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white font-semibold text-[var(--brand)]">
                {initials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{user.name}</p>
                <p className="text-sm text-white/80">
                  {user.title} · {user.location}
                </p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Uitloggen
                </button>
              </form>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
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
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">
                  Demo-richting
                </p>
                <div className="mt-4 space-y-4 text-sm leading-6 text-[var(--ink-soft)]">
                  <p>Deze MVP laat zien hoe onboarding, kennisdeling en POP-begeleiding samenkomen in een rustige, merkvaste flow.</p>
                  <p>
                    Klaar voor uitbreiding naar echte data: de routes, rollen, acties en domeinmodellen staan al in de basis.
                  </p>
                  {user.role === "BEHEERDER" ? (
                    <Link
                      href="/admin"
                      className="inline-flex rounded-full bg-[var(--teal)] px-4 py-2 font-semibold text-white transition hover:opacity-90"
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
