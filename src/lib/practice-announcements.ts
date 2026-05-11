import type { AudienceProfile, Role, User } from "@/lib/types";

export type AnnouncementPriority = "INFO" | "IMPORTANT" | "URGENT";

export type ParsedAnnouncementDraftInput = {
  title: string;
  body: string;
  priority: AnnouncementPriority;
  visibleToAll: boolean;
  targetRoles: Role[];
  targetAudienceProfiles: AudienceProfile[];
  targetUserIds: string[];
  publishAt: Date | null;
  expiresAt: Date | null;
};

export type AnnouncementAudienceLike = {
  id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  visibleToAll: boolean;
  targetRoles: Role[];
  targetAudienceProfiles: AudienceProfile[];
  targetUserIds: string[];
};

export type AnnouncementNotificationPayload = {
  userId: string;
  announcementId: string;
  type: "ANNOUNCEMENT";
  title: string;
  body: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  href: string;
};

const PRACTICE_ANNOUNCEMENT_ROLES: Role[] = ["PRAKTIJKMANAGER", "PRAKTIJKHOUDER", "BEHEERDER"];
const VALID_PRIORITIES: AnnouncementPriority[] = ["INFO", "IMPORTANT", "URGENT"];
const VALID_ROLES: Role[] = ["MEDEWERKER", "TEAMLEIDER", "PRAKTIJKMANAGER", "PRAKTIJKHOUDER", "BEHEERDER", "REVIEWER"];
const VALID_AUDIENCE_PROFILES: AudienceProfile[] = ["FYSIOTHERAPEUT", "PRAKTIJKONDERSTEUNER", "FITCOACH"];

export function canManagePracticeAnnouncements(role: Role) {
  return PRACTICE_ANNOUNCEMENT_ROLES.includes(role);
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getStringArray(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .flatMap((value) => (typeof value === "string" ? value.split(",") : []))
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseOptionalDate(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Datum is ongeldig");
  }
  return parsed;
}

export function parseAnnouncementDraftInput(formData: FormData): ParsedAnnouncementDraftInput {
  const title = getString(formData, "title");
  const body = getString(formData, "body");

  if (!title) {
    throw new Error("Titel is verplicht");
  }
  if (!body) {
    throw new Error("Tekst is verplicht");
  }

  const priorityCandidate = getString(formData, "priority") || "INFO";
  const priority = VALID_PRIORITIES.includes(priorityCandidate as AnnouncementPriority)
    ? (priorityCandidate as AnnouncementPriority)
    : "INFO";

  const visibleValue = getString(formData, "visibleToAll");

  const targetRoles = getStringArray(formData, "targetRoles").filter((role): role is Role =>
    VALID_ROLES.includes(role as Role),
  );
  const targetAudienceProfiles = getStringArray(formData, "targetAudienceProfiles").filter(
    (profile): profile is AudienceProfile => VALID_AUDIENCE_PROFILES.includes(profile as AudienceProfile),
  );
  const targetUserIds = getStringArray(formData, "targetUserIds");
  const hasExplicitTargets = Boolean(targetRoles.length || targetAudienceProfiles.length || targetUserIds.length);
  const visibleToAll = visibleValue === "false" || hasExplicitTargets ? false : true;

  return {
    title,
    body,
    priority,
    visibleToAll,
    targetRoles,
    targetAudienceProfiles,
    targetUserIds,
    publishAt: parseOptionalDate(getString(formData, "publishAt")),
    expiresAt: parseOptionalDate(getString(formData, "expiresAt")),
  };
}

function severityForPriority(priority: AnnouncementPriority) {
  if (priority === "URGENT") {
    return "CRITICAL" as const;
  }
  if (priority === "IMPORTANT") {
    return "WARNING" as const;
  }
  return "INFO" as const;
}

function userMatchesAnnouncement(user: User, announcement: AnnouncementAudienceLike) {
  if (announcement.visibleToAll) {
    return true;
  }
  if (announcement.targetUserIds.includes(user.id)) {
    return true;
  }
  if (announcement.targetRoles.includes(user.role)) {
    return true;
  }
  return announcement.targetAudienceProfiles.includes(user.audienceProfile);
}

export function buildAnnouncementNotificationPayloads({
  announcement,
  users,
}: {
  announcement: AnnouncementAudienceLike;
  users: User[];
}): AnnouncementNotificationPayload[] {
  return users
    .filter((user) => user.isActive && userMatchesAnnouncement(user, announcement))
    .map((user) => ({
      userId: user.id,
      announcementId: announcement.id,
      type: "ANNOUNCEMENT",
      title: announcement.title,
      body: announcement.body,
      severity: severityForPriority(announcement.priority),
      href: "/#nieuws-signalen",
    }));
}
