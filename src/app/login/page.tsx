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
      <div className="mx-auto flex min-h-[92vh] max-w-6xl items-center">
        <section className="hero-panel soft-grid relative w-full overflow-hidden rounded-[44px] px-6 py-8 sm:px-8 lg:px-12 lg:py-12">
          <div className="diamond-shape right-32 top-20 h-28 w-28 opacity-90" />
          <div className="orb-ring right-44 top-14 h-36 w-36" />
          <BrandMark className="watermark-logo h-32 w-32 text-[var(--brand)]" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_420px] lg:gap-14">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="brand-chip">Fy-fit Academy</div>
                <div className="accent-line" />
                <div className="space-y-4">
                  <p className="text-lg font-semibold text-[var(--brand)]">Gebroken wit, zacht en duidelijk</p>
                  <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-[var(--foreground)] lg:text-6xl">
                    Leren, onboarding en ontwikkeling in een omgeving die rust uitstraalt
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
                    Een interne Fy-fit omgeving voor collega&apos;s die willen landen in de organisatie, kennis willen borgen en gericht willen groeien in hun vak.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="card-surface rounded-[24px] p-5">
                  <p className="text-3xl font-semibold text-[var(--foreground)]">10</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">stappen in de onboardingflow</p>
                </div>
                <div className="card-surface rounded-[24px] p-5">
                  <p className="text-3xl font-semibold text-[var(--foreground)]">3</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">academylijnen voor kwaliteit en communicatie</p>
                </div>
                <div className="card-surface rounded-[24px] p-5">
                  <p className="text-3xl font-semibold text-[var(--foreground)]">1</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">plek voor POP, documenten en voortgang</p>
                </div>
              </div>
            </div>

            <div className="frost-panel relative rounded-[34px] p-6 sm:p-8">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                  Inloggen
                </p>
                <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
                  Welkom terug
                </h2>
                <p className="text-sm leading-7 text-[var(--ink-soft)]">
                  Log in met je toegewezen demo-account. Voor deze demonstratie gebruiken alle accounts het wachtwoord <strong>fyfit-demo</strong>.
                </p>
              </div>

              <form action={loginAction} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-slate-900">
                    E-mailadres
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue="luuk@fysiotherapienijmegen.nl"
                    className="w-full rounded-2xl border border-[var(--border)] bg-white/95 px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
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
                    className="w-full rounded-2xl border border-[var(--border)] bg-white/95 px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
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
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
