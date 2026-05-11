import { prisma } from "@/lib/prisma";
import {
  buildDeadlineNotifications,
  buildNotificationCenter,
  type NotificationCenter,
  type NotificationLike,
} from "@/lib/notifications";
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

function shouldReceiveCourseReviewSignals(user: User) {
  return user.role === "BEHEERDER" || user.role === "REVIEWER";
}

async function getLiveDeadlineSignals(user: User): Promise<NotificationLike[]> {
  const now = new Date();
  const courseReviewWhere = shouldReceiveCourseReviewSignals(user)
    ? {
        revisionDueAt: { lte: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14) },
        status: { not: "ARCHIVED" as const },
      }
    : undefined;

  const [learningGoals, enrollments, courses] = await Promise.all([
    prisma.learningGoal.findMany({
      where: {
        userId: user.id,
        status: { not: "AFGEROND" },
        targetDate: { lte: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14) },
      },
      select: { id: true, userId: true, title: true, description: true, status: true, targetDate: true, updatedAt: true },
      take: 20,
    }),
    prisma.enrollment.findMany({
      where: {
        userId: user.id,
        status: { notIn: ["COMPLETED", "FAILED", "EXPIRED"] },
        deadlineAt: { lte: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14) },
      },
      select: { id: true, userId: true, deadlineAt: true, status: true, course: { select: { title: true } } },
      take: 20,
    }),
    courseReviewWhere
      ? prisma.course.findMany({
          where: courseReviewWhere,
          select: { id: true, title: true, revisionDueAt: true, status: true },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  return buildDeadlineNotifications({
    now,
    learningGoals: learningGoals.map((goal) => ({
      id: goal.id,
      userId: goal.userId,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      targetDate: goal.targetDate?.toISOString().slice(0, 10),
      updatedAt: goal.updatedAt.toISOString().slice(0, 10),
    })),
    enrollments: enrollments.map((enrollment) => ({
      id: enrollment.id,
      userId: enrollment.userId,
      courseTitle: enrollment.course.title,
      deadlineAt: enrollment.deadlineAt,
      status: enrollment.status,
    })),
    courses,
    courseAudienceUserIds: shouldReceiveCourseReviewSignals(user) ? [user.id] : [],
  }).map((notification) => ({
    id: `signal-${notification.sourceType}-${notification.sourceId}-${notification.userId}`,
    userId: notification.userId,
    type: notification.type,
    severity: notification.severity,
    title: notification.title,
    body: notification.body,
    href: notification.href,
    sourceId: notification.sourceId,
    sourceType: notification.sourceType,
    readAt: null,
    createdAt: notification.createdAt,
    expiresAt: null,
  }));
}

export async function getNotificationCenterForUser(user: User): Promise<NotificationCenter> {
  try {
    const [notifications, liveDeadlineSignals] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId: user.id,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      getLiveDeadlineSignals(user),
    ]);

    return buildNotificationCenter({
      user,
      notifications: [...notifications.map(toNotificationLike), ...liveDeadlineSignals],
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Notificaties konden niet worden geladen.", error);
    }

    return buildNotificationCenter({ user, notifications: [] });
  }
}
