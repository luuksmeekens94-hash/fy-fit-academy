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
    <main className="min-h-screen bg-transparent px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <section className="hero-panel soft-grid relative w-full overflow-hidden rounded-[44px] px-6 py-8 sm:px-10 sm:py-10">
          <div className="diamond-shape right-16 top-10 h-24 w-24 opacity-80" />
          <div className="orb-ring right-28 top-0 h-32 w-32" />

          <div className="relative mx-auto flex max-w-xl flex-col items-center text-center">
            <div className="brand-chip">Fy-fit Academy</div>
            <div className="mt-6 h-2 w-full max-w-[560px] rounded-full bg-[var(--brand)]" />

            <div className="mt-8 space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                Persoonlijke en professionele groei
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
                Inloggen
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-8 text-[var(--ink-soft)] sm:text-lg">
                Een rustige, heldere omgeving voor onboarding, academymodules en ontwikkeling binnen Fy-fit.
              </p>
            </div>

            <div className="frost-panel mt-8 w-full rounded-[34px] p-6 text-left sm:p-8">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                  Welkom terug
                </p>
                <p className="text-sm leading-7 text-[var(--ink-soft)]">
                  Log in met je toegewezen demo-account. Voor deze demonstratie gebruiken alle accounts het wachtwoord <strong>fyfit-demo</strong>.
                </p>
              </div>

              <form action={loginAction} className="mt-6 space-y-4">
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
