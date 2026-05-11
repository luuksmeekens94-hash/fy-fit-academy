import type { AudienceProfile, LearningGoal, Role, User } from "@/lib/types";

export type AnnouncementStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type AnnouncementPriority = "INFO" | "IMPORTANT" | "URGENT";
export type NotificationType =
  | "ANNOUNCEMENT"
  | "COURSE_PUBLISHED"
  | "COURSE_UPDATED"
  | "DEADLINE_APPROACHING"
  | "DEADLINE_OVERDUE"
  | "ACCREDITATION_REVIEW"
  | "SYSTEM";
export type NotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";

export type AnnouncementLike = {
  id: string;
  title: string;
  body: string;
  status: AnnouncementStatus;
  priority: AnnouncementPriority;
  visibleToAll: boolean;
  targetRoles: Role[];
  targetAudienceProfiles: AudienceProfile[];
  targetUserIds: string[];
  publishAt: Date | string | null;
  expiresAt: Date | string | null;
  createdAt: Date | string;
};

export type NotificationLike = {
  id: string;
  userId: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  href: string | null;
  sourceId?: string | null;
  sourceType?: string | null;
  readAt: Date | string | null;
  createdAt: Date | string;
  expiresAt: Date | string | null;
};

export type NotificationCenterItem = NotificationLike & {
  label: string;
};

export type NotificationCenter = {
  unreadCount: number;
  items: NotificationCenterItem[];
  hasCritical: boolean;
};

type EnrollmentDeadlineLike = {
  id: string;
  userId: string;
  courseTitle: string;
  deadlineAt: Date | string | null;
  status: string;
};

type CourseRevisionLike = {
  id: string;
  title: string;
  revisionDueAt: Date | string | null;
  status: string;
};

type BuiltDeadlineNotification = Omit<NotificationLike, "id" | "readAt" | "expiresAt" | "createdAt"> & {
  type: NotificationType;
  severity: NotificationSeverity;
  sourceId: string;
  sourceType: string;
  createdAt: Date;
  readAt: null;
  expiresAt: null;
};

function toDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

function isExpired(expiresAt: Date | string | null, now: Date) {
  const date = toDate(expiresAt);
  return Boolean(date && date.getTime() < now.getTime());
}

function daysUntil(date: Date | string | null, now: Date) {
  const due = toDate(date);
  if (!due) {
    return null;
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((due.getTime() - now.getTime()) / msPerDay);
}

function isRelevantWindow(date: Date | string | null, now: Date, windowDays = 14) {
  const days = daysUntil(date, now);
  return days !== null && days <= windowDays;
}

export function canSeeAnnouncement(user: User, announcement: AnnouncementLike, now = new Date()) {
  if (announcement.status !== "PUBLISHED") {
    return false;
  }

  if (isExpired(announcement.expiresAt, now)) {
    return false;
  }

  const publishAt = toDate(announcement.publishAt);
  if (publishAt && publishAt.getTime() > now.getTime()) {
    return false;
  }

  return (
    announcement.visibleToAll ||
    announcement.targetUserIds.includes(user.id) ||
    announcement.targetRoles.includes(user.role) ||
    announcement.targetAudienceProfiles.includes(user.audienceProfile)
  );
}

export function getNotificationLabel(type: NotificationType) {
  switch (type) {
    case "ANNOUNCEMENT":
      return "Nieuws";
    case "COURSE_PUBLISHED":
      return "Nieuwe e-learning";
    case "COURSE_UPDATED":
      return "Wijziging";
    case "DEADLINE_APPROACHING":
      return "Binnenkort";
    case "DEADLINE_OVERDUE":
      return "Over tijd";
    case "ACCREDITATION_REVIEW":
      return "Review nodig";
    default:
      return "Info";
  }
}

export function buildNotificationCenter({
  user,
  notifications,
  now = new Date(),
  limit = 5,
}: {
  user: User;
  notifications: NotificationLike[];
  now?: Date;
  limit?: number;
}): NotificationCenter {
  const relevant = notifications
    .filter((notification) => notification.userId === user.id)
    .filter((notification) => !isExpired(notification.expiresAt, now));
  const unread = relevant.filter((notification) => !notification.readAt);

  const items = [...unread]
    .sort((a, b) => {
      const severityRank: Record<NotificationSeverity, number> = { CRITICAL: 0, WARNING: 1, SUCCESS: 2, INFO: 3 };
      const rankDelta = severityRank[a.severity] - severityRank[b.severity];
      if (rankDelta !== 0) {
        return rankDelta;
      }

      return toDate(b.createdAt)!.getTime() - toDate(a.createdAt)!.getTime();
    })
    .slice(0, limit)
    .map((notification) => ({ ...notification, label: getNotificationLabel(notification.type) }));

  return {
    unreadCount: unread.length,
    items,
    hasCritical: unread.some((notification) => notification.severity === "CRITICAL"),
  };
}

export function buildDeadlineNotifications({
  now = new Date(),
  learningGoals = [],
  enrollments = [],
  courses = [],
  courseAudienceUserIds = ["academy-admin"],
  windowDays = 14,
}: {
  now?: Date;
  learningGoals?: LearningGoal[];
  enrollments?: EnrollmentDeadlineLike[];
  courses?: CourseRevisionLike[];
  courseAudienceUserIds?: string[];
  windowDays?: number;
}): BuiltDeadlineNotification[] {
  const items: BuiltDeadlineNotification[] = [];

  for (const goal of learningGoals) {
    if (goal.status === "AFGEROND" || !isRelevantWindow(goal.targetDate ?? null, now, windowDays)) {
      continue;
    }

    const days = daysUntil(goal.targetDate ?? null, now) ?? 0;
    const overdue = days < 0;
    items.push({
      userId: goal.userId,
      type: overdue ? "DEADLINE_OVERDUE" : "DEADLINE_APPROACHING",
      severity: overdue ? "CRITICAL" : "WARNING",
      title: overdue ? "POP/functioneren deadline verlopen" : "POP/functioneren deadline nadert",
      body: `${goal.title} ${overdue ? "is over tijd" : `staat over ${days} dag(en) gepland`}.`,
      href: "/ontwikkeling",
      sourceId: goal.id,
      sourceType: "LearningGoal",
      createdAt: now,
      readAt: null,
      expiresAt: null,
    });
  }

  for (const enrollment of enrollments) {
    if (["COMPLETED", "FAILED", "EXPIRED"].includes(enrollment.status) || !isRelevantWindow(enrollment.deadlineAt, now, windowDays)) {
      continue;
    }

    const days = daysUntil(enrollment.deadlineAt, now) ?? 0;
    const overdue = days < 0;
    items.push({
      userId: enrollment.userId,
      type: overdue ? "DEADLINE_OVERDUE" : "DEADLINE_APPROACHING",
      severity: overdue ? "CRITICAL" : "WARNING",
      title: overdue ? "E-learning deadline verlopen" : "E-learning deadline nadert",
      body: `${enrollment.courseTitle} ${overdue ? "is over tijd" : `moet binnen ${days} dag(en) afgerond zijn`}.`,
      href: "/academy",
      sourceId: enrollment.id,
      sourceType: "Enrollment",
      createdAt: now,
      readAt: null,
      expiresAt: null,
    });
  }

  for (const course of courses) {
    if (course.status === "ARCHIVED" || !isRelevantWindow(course.revisionDueAt, now, windowDays)) {
      continue;
    }

    const days = daysUntil(course.revisionDueAt, now) ?? 0;
    const overdue = days < 0;
    for (const userId of courseAudienceUserIds) {
      items.push({
        userId,
        type: "ACCREDITATION_REVIEW",
        severity: overdue ? "CRITICAL" : "WARNING",
        title: overdue ? "Cursusreview verlopen" : "Cursusreview nadert",
        body: `${course.title} ${overdue ? "moet opnieuw beoordeeld worden" : `heeft binnen ${days} dag(en) review nodig`}.`,
        href: "/academybeheer#accreditatie",
        sourceId: course.id,
        sourceType: "Course",
        createdAt: now,
        readAt: null,
        expiresAt: null,
      });
    }
  }

  return items;
}
