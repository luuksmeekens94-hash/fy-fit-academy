import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { getStore } from "@/lib/demo-data";

export default async function AdminPage() {
  await requireRole(["BEHEERDER"]);
  const store = getStore();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Beheer van inhoud, mensen en lijnen"
        description="Deze demo-admin is bewust licht gehouden, maar laat wel de kern zien van gebruikersbeheer, contentoverzicht en ontwikkelitems."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Gebruikers", value: store.users.length, tone: "brand" as const },
          { label: "Modules", value: store.modules.length, tone: "warning" as const },
          { label: "Bibliotheekitems", value: store.documents.length, tone: "success" as const },
          {
            label: "Ontwikkelitems",
            value: store.learningGoals.length + store.developmentDocuments.length,
            tone: "neutral" as const,
          },
        ].map((metric) => (
          <div key={metric.label} className="card-surface rounded-[28px] p-5">
            <StatusBadge label={metric.label} tone={metric.tone} />
            <p className="mt-5 text-4xl font-semibold text-slate-950">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card-surface rounded-[32px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
            Gebruikers
          </p>
          <div className="mt-6 space-y-4">
            {store.users.map((user) => (
              <div
                key={user.id}
                className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">{user.name}</h2>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {user.title} · {user.location}
                    </p>
                  </div>
                  <StatusBadge label={user.role} tone="brand" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface rounded-[32px] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">
              Content
            </p>
            <div className="mt-6 space-y-4">
              {store.modules.map((module) => (
                <div
                  key={module.id}
                  className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-950">{module.title}</h2>
                    <StatusBadge label={module.status} tone="warning" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                    {module.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface rounded-[32px] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
              Ontwikkeling
            </p>
            <div className="mt-6 space-y-4">
              {store.developmentDocuments.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                    <StatusBadge label={item.category} tone="neutral" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
