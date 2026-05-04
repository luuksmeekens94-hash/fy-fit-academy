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
        <div className="hero-panel rounded-[24px] px-5 py-5 text-[var(--foreground)] lg:px-7">
          <div className="soft-grid absolute inset-0 rounded-[28px]" />
          <div className="diamond-shape right-16 top-10 hidden h-20 w-20 opacity-20 md:block" />
          <div className="orb-ring right-28 top-0 hidden h-28 w-28 opacity-40 md:block" />
          <div className="relative flex flex-col gap-4">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3 lg:flex-1">
                <div className="brand-chip">Fy-fit Academy</div>
                <div className="accent-line" />
                <div>
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-[var(--foreground)] lg:text-4xl">
                    Leren, ontwikkelen en borgen in de praktijk.
                  </h1>
                </div>
              </div>
              <div className="group relative z-20 self-start">
                <div className="frost-panel flex items-center gap-3 rounded-[22px] px-4 py-3 lg:min-w-[320px]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sage-soft)] font-semibold text-[var(--teal)]">
                    {initials(user.name)}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-[var(--border)] bg-white/90 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                    foto
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-[var(--foreground)]">{user.name}</p>
                    <p className="text-sm text-[var(--ink-soft)]">Profielmenu</p>
                  </div>
                </div>

                <div className="pointer-events-none invisible absolute right-0 top-full w-72 translate-y-2 pt-3 opacity-0 transition duration-200 group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <div className="card-surface rounded-[22px] p-3">
                    <nav className="space-y-1">
                      <Link href="/" className="block rounded-2xl px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--brand-soft)]">
                        Dashboard
                      </Link>
                      <Link href="/academy" className="block rounded-2xl px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--brand-soft)]">
                        Fy-fit Academy
                      </Link>
                      <Link href="/ontwikkeling" className="block rounded-2xl px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--brand-soft)]">
                        Mijn ontwikkeling
                      </Link>
                      {user.isOnboarding || user.role !== "MEDEWERKER" ? (
                        <Link href="/onboarding" className="block rounded-2xl px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--brand-soft)]">
                          Onboarding
                        </Link>
                      ) : null}
                      <Link href="/bibliotheek" className="block rounded-2xl px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--brand-soft)]">
                        Praktijkbibliotheek
                      </Link>
                      <Link href="/mijn-gegevens" className="block rounded-2xl px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--brand-soft)]">
                        Mijn gegevens
                      </Link>
                    </nav>

                    <div className="mt-3 border-t border-[var(--border)] pt-3">
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--brand-soft)]"
                        >
                          Uitloggen
                        </button>
                      </form>
                    </div>
                  </div>
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
          <main className="space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
