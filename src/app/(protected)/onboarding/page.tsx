import { toggleOnboardingStepAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getOnboardingProgressForUser, getStore, getUserById } from "@/lib/demo-data";
import { formatDate, getOnboardingCompletion } from "@/lib/utils";

export default async function OnboardingPage() {
  const user = await requireUser();
  const store = getStore();
  const targetUser =
    user.role === "MEDEWERKER"
      ? user
      : getUserById("user-medewerker-1") ?? user;
  const progress = getOnboardingProgressForUser(targetUser.id);
  const completion = getOnboardingCompletion(store.onboardingPath.steps, progress);
  const buddy = targetUser.buddyId ? getUserById(targetUser.buddyId) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title={`${store.onboardingPath.name} voor ${targetUser.name.split(" ")[0]}`}
        description={store.onboardingPath.description}
      />

      <section className="card-surface rounded-[32px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
              Voortgang
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">{completion}% afgerond</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              Buddy: {buddy?.name ?? "Nog niet gekoppeld"} · Laat nieuwe collega&apos;s stap voor stap landen in taal, kwaliteit en werkritme.
            </p>
          </div>
          <div className="w-full max-w-md rounded-full bg-white p-2">
            <div
              className="h-4 rounded-full bg-[var(--brand)] transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {store.onboardingPath.steps
          .sort((a, b) => a.order - b.order)
          .map((step) => {
            const entry = progress.find((progressItem) => progressItem.stepId === step.id);

            return (
              <div key={step.id} className="card-surface rounded-[32px] p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge
                        label={entry?.completed ? "Afgerond" : "Open"}
                        tone={entry?.completed ? "success" : "warning"}
                      />
                      <StatusBadge label={`Stap ${step.order}`} tone="neutral" />
                      <StatusBadge label={step.contentType} tone="brand" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-950">{step.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                        {step.description}
                      </p>
                    </div>
                    <p className="rounded-[24px] bg-white/85 px-4 py-4 text-sm leading-7 text-[var(--ink-soft)]">
                      {step.content}
                    </p>
                    {entry?.notes ? (
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                        Notitie: {entry.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="min-w-[220px] space-y-3">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                      {entry?.completedAt
                        ? `Afgetekend op ${formatDate(entry.completedAt)}`
                        : "Nog niet afgetekend"}
                    </p>
                    <form action={toggleOnboardingStepAction}>
                      <input type="hidden" name="stepId" value={step.id} />
                      <input type="hidden" name="targetUserId" value={targetUser.id} />
                      <button
                        type="submit"
                        className="w-full rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
                      >
                        {entry?.completed ? "Zet terug naar open" : "Markeer als afgerond"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
      </section>
    </div>
  );
}
