import { redirect } from "next/navigation";

import { loginAction } from "@/app/actions";
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
        <section className="hero-panel soft-grid flex flex-col justify-between rounded-[40px] p-8 text-white lg:p-10">
          <div className="space-y-5">
            <div className="inline-flex rounded-full bg-white/12 px-4 py-1 text-sm font-medium">
              Fy-fit Academy
            </div>
            <div className="space-y-3">
              <h1 className="display-font max-w-xl text-5xl font-semibold leading-tight">
                Een interne academy die onboarding en ontwikkeling laat landen
              </h1>
              <p className="max-w-2xl text-base leading-8 text-white/88">
                Deze demo laat zien hoe nieuwe collega&apos;s, teamleiders en beheerders in dezelfde omgeving werken aan kwaliteit, kennisdeling en persoonlijke groei.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] bg-white/12 p-5 backdrop-blur-sm">
              <p className="text-3xl font-semibold">10</p>
              <p className="mt-2 text-sm text-white/80">onboardingstappen in de basisflow</p>
            </div>
            <div className="rounded-[28px] bg-white/12 p-5 backdrop-blur-sm">
              <p className="text-3xl font-semibold">3</p>
              <p className="mt-2 text-sm text-white/80">voorbeeldmodules voor academy en kernboodschap</p>
            </div>
            <div className="rounded-[28px] bg-white/12 p-5 backdrop-blur-sm">
              <p className="text-3xl font-semibold">2</p>
              <p className="mt-2 text-sm text-white/80">testmedewerkers met POP en monitoring</p>
            </div>
          </div>
        </section>

        <section className="card-surface flex flex-col justify-center rounded-[40px] p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--teal)]">
                Demo login
              </p>
              <h2 className="display-font text-4xl font-semibold tracking-tight text-slate-950">
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

            <div className="space-y-3 rounded-[28px] border border-[var(--border)] bg-white/75 p-5">
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
