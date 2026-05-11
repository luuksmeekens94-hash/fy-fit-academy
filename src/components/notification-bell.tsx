import Link from "next/link";

import type { NotificationCenter } from "@/lib/notifications";

type NotificationBellProps = {
  center?: NotificationCenter;
};

export function NotificationBell({ center }: NotificationBellProps) {
  const unreadCount = center?.unreadCount ?? 0;
  const hasCritical = center?.hasCritical ?? false;

  return (
    <Link
      href="/#nieuws-signalen"
      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white/90 text-lg shadow-sm transition hover:border-[var(--brand)]"
      aria-label={unreadCount ? `${unreadCount} ongelezen melding(en)` : "Geen ongelezen meldingen"}
      title={unreadCount ? `${unreadCount} ongelezen melding(en)` : "Geen ongelezen meldingen"}
    >
      <span aria-hidden="true">{hasCritical ? "🚨" : "🔔"}</span>
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 text-xs font-bold text-white ring-2 ring-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
