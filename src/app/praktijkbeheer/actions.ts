"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { listActiveUsers } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import {
  buildAnnouncementNotificationPayloads,
  canManagePracticeAnnouncements,
  parseAnnouncementDraftInput,
} from "@/lib/practice-announcements";

function assertCanManage(role: Awaited<ReturnType<typeof requireRole>>["role"]) {
  if (!canManagePracticeAnnouncements(role)) {
    redirect("/");
  }
}

async function createNotificationsForAnnouncement(announcementId: string) {
  const [announcement, users] = await Promise.all([
    prisma.announcement.findUnique({ where: { id: announcementId } }),
    listActiveUsers(),
  ]);

  if (!announcement) {
    throw new Error("Mededeling niet gevonden");
  }

  const payloads = buildAnnouncementNotificationPayloads({
    announcement: {
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      priority: announcement.priority,
      visibleToAll: announcement.visibleToAll,
      targetRoles: announcement.targetRoles,
      targetAudienceProfiles: announcement.targetAudienceProfiles,
      targetUserIds: announcement.targetUserIds,
    },
    users,
  });

  if (!payloads.length) {
    return;
  }

  await prisma.notification.createMany({
    data: payloads.map((payload) => ({
      userId: payload.userId,
      type: payload.type,
      severity: payload.severity,
      title: payload.title,
      body: payload.body,
      href: payload.href,
      sourceId: announcement.id,
      sourceType: "Announcement",
      expiresAt: announcement.expiresAt,
    })),
  });
}

export async function savePracticeAnnouncementAction(formData: FormData) {
  const user = await requireRole(["PRAKTIJKMANAGER", "PRAKTIJKHOUDER", "BEHEERDER"]);
  assertCanManage(user.role);

  const intent = formData.get("intent") === "publish" ? "publish" : "draft";
  const parsed = parseAnnouncementDraftInput(formData);

  const announcement = await prisma.announcement.create({
    data: {
      ...parsed,
      status: intent === "publish" ? "PUBLISHED" : "DRAFT",
      publishAt: intent === "publish" ? new Date() : parsed.publishAt,
      createdById: user.id,
      publishedById: intent === "publish" ? user.id : null,
    },
  });

  if (intent === "publish") {
    await createNotificationsForAnnouncement(announcement.id);
  }

  revalidatePath("/");
  revalidatePath("/praktijkbeheer");
}

export async function publishPracticeAnnouncementAction(announcementId: string) {
  const user = await requireRole(["PRAKTIJKMANAGER", "PRAKTIJKHOUDER", "BEHEERDER"]);
  assertCanManage(user.role);

  await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      status: "PUBLISHED",
      publishAt: new Date(),
      publishedById: user.id,
    },
  });
  await createNotificationsForAnnouncement(announcementId);

  revalidatePath("/");
  revalidatePath("/praktijkbeheer");
}

export async function archivePracticeAnnouncementAction(announcementId: string) {
  const user = await requireRole(["PRAKTIJKMANAGER", "PRAKTIJKHOUDER", "BEHEERDER"]);
  assertCanManage(user.role);

  await prisma.announcement.update({
    where: { id: announcementId },
    data: { status: "ARCHIVED" },
  });

  revalidatePath("/");
  revalidatePath("/praktijkbeheer");
}
