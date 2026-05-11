"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const NOTIFICATION_REVALIDATION_PATHS = [
  "/",
  "/academy",
  "/academybeheer",
  "/admin",
  "/ontwikkeling",
  "/praktijkbeheer",
  "/team",
  "/mijn-gegevens",
];

function revalidateNotificationSurfaces() {
  for (const path of NOTIFICATION_REVALIDATION_PATHS) {
    revalidatePath(path);
  }
}

export async function markNotificationReadAction(notificationId: string) {
  const user = await requireUser();

  if (!notificationId || notificationId.startsWith("signal-")) {
    return;
  }

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: user.id,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  revalidateNotificationSurfaces();
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      readAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    data: {
      readAt: new Date(),
    },
  });

  revalidateNotificationSurfaces();
}
