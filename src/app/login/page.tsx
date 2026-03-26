import { redirect } from "next/navigation";

import { loginAction } from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import { getSessionUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getSessionUser();

  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const showError = params.error === "1";

  return (
    <main className="min-h-screen bg-transparent px-4 py-8">
      <div className="mx-auto grid min-h-[92vh] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hero-panel soft-grid relative flex flex-col justify-between rounded-[40px] p-8 lg:p-10">
          <BrandMark className="watermark-logo h-36 w-36 text-[var(--brand)]" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_300px] lg:items-start">
            <div className="hero-copy space-y-6">
              <div className="brand-chip">Fy-fit Academy</div>
              <div className="accent-line" />
              <div className="space-y-4">
                <p className="text-lg font-semibold text-[var(--brand)]">Gebroken wit, zacht en duidelijk</p>
                <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-[var(--foreground)]">
                  Een interne academy die onboarding en ontwikkeling laat landen
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
                  Deze demo laat zien hoe nieuwe collega&apos;s, teamleiders en beheerders in dezelfde omgeving werken aan kwaliteit, kennisdeling en persoonlijke groei.
                </p>
              </div>
            </div>
            <div className="hero-art hidden lg:block">
              <div className="diamond-soft right-4 top-0 h-44 w-44" />
              <div className="orb-ring left-5 top-20 h-40 w-40" />
              <div className="diamond-shape right-12 top-24 h-32 w-32 opacity-78" />
              <BrandMark className="absolute bottom-10 right-6 h-24 w-24 text-[var(--brand)] opacity-[0.14]" />
            </div>
          </div>
          <div className="hero-copy relative grid gap-4 sm:grid-cols-3">
            <div className="card-surface rounded-[22px] p-5">
              <p className="text-3xl font-semibold text-[var(--foreground)]">10</p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">onboardingstappen in de basisflow</p>
            </div>
            <div className="card-surface rounded-[22px] p-5">
              <p className="text-3xl font-semibold text-[var(--foreground)]">3</p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">voorbeeldmodules voor academy en kernboodschap</p>
            </div>
            <div className="card-surface rounded-[22px] p-5">
              <p className="text-3xl font-semibold text-[var(--foreground)]">2</p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">testmedewerkers met POP en monitoring</p>
            </div>
          </div>
        </section>

        <section className="card-surface flex flex-col justify-center rounded-[40px] p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                Demo login
              </p>
              <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
                Welkom terug
              </h2>
              <p className="text-sm leading-7 text-[var(--ink-soft)]">
                Log in met een demo-account. Alle accounts gebruiken het wachtwoord <strong>fyfit-demo</strong>.
              </p>
            </div>

            <form action={loginAction} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-900">
                  E-mailadres
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue="ryan@fy-fitacademy.demo"
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-900">
                  Wachtwoord
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  defaultValue="fyfit-demo"
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                  required
                />
              </div>
              {showError ? (
                <p className="rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                  De combinatie van e-mail en wachtwoord klopt niet.
                </p>
              ) : null}
              <button
                type="submit"
                className="w-full rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
              >
                Inloggen
              </button>
            </form>

            <div className="space-y-3 rounded-[28px] border border-[var(--border)] bg-[var(--card-strong)]/75 p-5">
              <p className="text-sm font-semibold text-slate-900">Snelle demo-accounts</p>
              <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
                <li>Heidi, beheerder: `heidi@fy-fitacademy.demo`</li>
                <li>Dave, teamleider: `dave@fy-fitacademy.demo`</li>
                <li>Ryan, medewerker in onboarding: `ryan@fy-fitacademy.demo`</li>
                <li>Fleur, medewerker: `fleur@fy-fitacademy.demo`</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
