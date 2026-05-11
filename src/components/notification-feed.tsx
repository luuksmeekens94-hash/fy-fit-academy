import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import type { NotificationCenter } from "@/lib/notifications";

function getTone(severity: string) {
  if (severity === "CRITICAL") {
    return "warning" as const;
  }

  if (severity === "SUCCESS") {
    return "success" as const;
  }

  if (severity === "WARNING") {
    return "warning" as const;
  }

  return "neutral" as const;
}

type NotificationFeedProps = {
  center?: NotificationCenter;
};

export function NotificationFeed({ center }: NotificationFeedProps) {
  const items = center?.items.slice(0, 3) ?? [];

  return (
    <section id="nieuws-signalen" className="card-surface rounded-[28px] border border-[var(--brand)]/20 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">Nieuws & signalen</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Wat vraagt nu aandacht?</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">
            Meldingen over mededelingen, nieuwe e-learnings, wijzigingen en deadlines verschijnen hier rolgericht.
          </p>
        </div>
        <StatusBadge label={`${center?.unreadCount ?? 0} ongelezen`} tone={center?.hasCritical ? "warning" : "brand"} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {items.length ? items.map((item) => {
          const content = (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={item.label} tone={getTone(item.severity)} />
              </div>
              <h3 className="mt-3 font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.body}</p>
            </>
          );

          return item.href ? (
            <Link key={item.id} href={item.href} className="rounded-[22px] border border-[var(--border)] bg-white/85 p-4 transition hover:-translate-y-0.5 hover:border-[var(--brand)]">
              {content}
            </Link>
          ) : (
            <div key={item.id} className="rounded-[22px] border border-[var(--border)] bg-white/85 p-4">
              {content}
            </div>
          );
        }) : (
          <div className="md:col-span-3 rounded-[22px] border border-dashed border-[var(--border)] bg-white/75 p-4">
            <h3 className="font-semibold text-slate-950">Geen open signalen</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              Rust aan de voorkant. Nieuwe praktijkmededelingen, e-learning updates en deadlines komen hier automatisch binnen.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
