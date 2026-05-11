import Link from "next/link";

import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/(protected)/notifications/actions";
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
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <StatusBadge label={`${center?.unreadCount ?? 0} ongelezen`} tone={center?.hasCritical ? "warning" : "brand"} />
          {(center?.markableUnreadCount ?? 0) > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <button
                type="submit"
                className="rounded-full border border-[var(--brand)] bg-white/90 px-4 py-2 text-sm font-semibold text-[var(--brand-deep)] transition hover:-translate-y-0.5 hover:bg-[var(--brand-soft)]"
              >
                Alles als gelezen
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {items.length ? items.map((item) => {
          const markReadAction = markNotificationReadAction.bind(null, item.id);

          return (
            <article key={item.id} className="flex min-h-full flex-col rounded-[22px] border border-[var(--border)] bg-white/85 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={item.label} tone={getTone(item.severity)} />
                {item.canMarkRead ? <StatusBadge label="nieuw" tone="brand" /> : null}
              </div>
              <h3 className="mt-3 font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[var(--ink-soft)]">{item.body}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]"
                  >
                    Openen
                  </Link>
                ) : null}
                {item.canMarkRead ? (
                  <form action={markReadAction}>
                    <button
                      type="submit"
                      className="rounded-full bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--brand-deep)]"
                    >
                      Gelezen
                    </button>
                  </form>
                ) : (
                  <span className="text-xs font-medium text-[var(--muted)]">Live signaal</span>
                )}
              </div>
            </article>
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
