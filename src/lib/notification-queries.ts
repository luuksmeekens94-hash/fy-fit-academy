import { prisma } from "@/lib/prisma";
import { buildNotificationCenter, type NotificationCenter, type NotificationLike } from "@/lib/notifications";
import type { User } from "@/lib/types";

function toNotificationLike(entry: {
  id: string;
  userId: string;
  type: NotificationLike["type"];
  severity: NotificationLike["severity"];
  title: string;
  body: string;
  href: string | null;
  sourceId: string | null;
  sourceType: string | null;
  readAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}): NotificationLike {
  return entry;
}

export async function getNotificationCenterForUser(user: User): Promise<NotificationCenter> {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return buildNotificationCenter({
      user,
      notifications: notifications.map(toNotificationLike),
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Notificaties konden niet worden geladen.", error);
    }

    return buildNotificationCenter({ user, notifications: [] });
  }
}
