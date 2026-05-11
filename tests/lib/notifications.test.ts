import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCourseNotificationPayloads,
  buildDeadlineNotifications,
  buildNotificationCenter,
  canSeeAnnouncement,
  type AnnouncementLike,
  type NotificationLike,
} from "../../src/lib/notifications";
import type { User } from "../../src/lib/types";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "Test Gebruiker",
    email: "test@example.com",
    role: "MEDEWERKER",
    audienceProfile: "FYSIOTHERAPEUT",
    team: "Nijmegen",
    title: "Fysiotherapeut",
    location: "Nijmegen",
    isActive: true,
    isOnboarding: false,
    bio: "",
    avatarColor: "#fff",
    ...overrides,
  };
}

const baseAnnouncement: AnnouncementLike = {
  id: "ann-1",
  title: "Nieuwe protocolupdate",
  body: "Lees de update voor het teamoverleg.",
  status: "PUBLISHED",
  priority: "IMPORTANT",
  visibleToAll: false,
  targetRoles: [],
  targetAudienceProfiles: [],
  targetUserIds: [],
  publishAt: new Date("2026-05-01T08:00:00Z"),
  expiresAt: null,
  createdAt: new Date("2026-05-01T07:00:00Z"),
};

test("canSeeAnnouncement filtert op gebruiker, rol, doelgroep en publicatiestatus", () => {
  const medewerker = makeUser({ id: "u-med", role: "MEDEWERKER", audienceProfile: "FYSIOTHERAPEUT" });
  const praktijkmanager = makeUser({ id: "u-pm", role: "PRAKTIJKMANAGER", audienceProfile: "PRAKTIJKONDERSTEUNER" });
  const fitcoach = makeUser({ id: "u-fit", role: "MEDEWERKER", audienceProfile: "FITCOACH" });

  assert.equal(canSeeAnnouncement(medewerker, { ...baseAnnouncement, targetRoles: ["MEDEWERKER"] }), true);
  assert.equal(canSeeAnnouncement(praktijkmanager, { ...baseAnnouncement, targetRoles: ["MEDEWERKER"] }), false);
  assert.equal(canSeeAnnouncement(fitcoach, { ...baseAnnouncement, targetAudienceProfiles: ["FITCOACH"] }), true);
  assert.equal(canSeeAnnouncement(medewerker, { ...baseAnnouncement, targetUserIds: ["u-med"] }), true);
  assert.equal(canSeeAnnouncement(medewerker, { ...baseAnnouncement, visibleToAll: true }), true);
  assert.equal(canSeeAnnouncement(medewerker, { ...baseAnnouncement, status: "DRAFT", visibleToAll: true }), false);
  assert.equal(
    canSeeAnnouncement(medewerker, { ...baseAnnouncement, visibleToAll: true, expiresAt: new Date("2026-04-01T00:00:00Z") }, new Date("2026-05-01T00:00:00Z")),
    false,
  );
});

test("buildNotificationCenter sorteert relevante ongelezen meldingen en badge-count", () => {
  const user = makeUser({ id: "u-med" });
  const notifications: NotificationLike[] = [
    {
      id: "read",
      userId: "u-med",
      type: "SYSTEM",
      severity: "INFO",
      title: "Gelezen",
      body: "Al gezien",
      href: null,
      readAt: new Date("2026-05-01T09:00:00Z"),
      createdAt: new Date("2026-05-01T08:00:00Z"),
      expiresAt: null,
    },
    {
      id: "old",
      userId: "u-med",
      type: "ANNOUNCEMENT",
      severity: "INFO",
      title: "Ouder nieuws",
      body: "Rustig",
      href: "/praktijkbeheer",
      readAt: null,
      createdAt: new Date("2026-05-01T08:00:00Z"),
      expiresAt: null,
    },
    {
      id: "urgent",
      userId: "u-med",
      type: "DEADLINE_OVERDUE",
      severity: "CRITICAL",
      title: "Deadline verlopen",
      body: "POP afronden",
      href: "/ontwikkeling",
      readAt: null,
      createdAt: new Date("2026-05-02T08:00:00Z"),
      expiresAt: null,
    },
    {
      id: "other-user",
      userId: "u-other",
      type: "SYSTEM",
      severity: "INFO",
      title: "Niet voor jou",
      body: "Verborgen",
      href: null,
      readAt: null,
      createdAt: new Date("2026-05-03T08:00:00Z"),
      expiresAt: null,
    },
  ];

  const center = buildNotificationCenter({ user, notifications, now: new Date("2026-05-03T09:00:00Z") });

  assert.equal(center.unreadCount, 2);
  assert.deepEqual(center.items.map((item) => item.id), ["urgent", "old"]);
  assert.equal(center.items[0].label, "Over tijd");
});

test("buildNotificationCenter markeert alleen persistente meldingen als afhandelbaar", () => {
  const user = makeUser({ id: "u-med" });
  const now = new Date("2026-05-03T09:00:00Z");
  const center = buildNotificationCenter({
    user,
    now,
    notifications: [
      {
        id: "persisted-notification",
        userId: "u-med",
        type: "ANNOUNCEMENT",
        severity: "INFO",
        title: "Praktijknieuws",
        body: "Kan worden afgevinkt.",
        href: "/#nieuws-signalen",
        readAt: null,
        createdAt: now,
        expiresAt: null,
      },
      {
        id: "signal-LearningGoal-goal-1-u-med",
        userId: "u-med",
        type: "DEADLINE_APPROACHING",
        severity: "WARNING",
        title: "Deadline nadert",
        body: "Blijft zichtbaar zolang de bron openstaat.",
        href: "/ontwikkeling",
        readAt: null,
        createdAt: now,
        expiresAt: null,
      },
    ],
  });

  assert.deepEqual(
    center.items.map((item) => ({ id: item.id, canMarkRead: item.canMarkRead })),
    [
      { id: "signal-LearningGoal-goal-1-u-med", canMarkRead: false },
      { id: "persisted-notification", canMarkRead: true },
    ],
  );
});

test("buildNotificationCenter telt afhandelbare ongelezen meldingen apart van live signalen", () => {
  const user = makeUser({ id: "u-med" });
  const now = new Date("2026-05-03T09:00:00Z");
  const center = buildNotificationCenter({
    user,
    now,
    notifications: [
      {
        id: "persisted-notification",
        userId: "u-med",
        type: "ANNOUNCEMENT",
        severity: "INFO",
        title: "Praktijknieuws",
        body: "Kan worden afgevinkt.",
        href: "/#nieuws-signalen",
        readAt: null,
        createdAt: now,
        expiresAt: null,
      },
      {
        id: "signal-LearningGoal-goal-1-u-med",
        userId: "u-med",
        type: "DEADLINE_APPROACHING",
        severity: "WARNING",
        title: "Deadline nadert",
        body: "Bronmelding.",
        href: "/ontwikkeling",
        readAt: null,
        createdAt: now,
        expiresAt: null,
      },
    ],
  });

  assert.equal(center.unreadCount, 2);
  assert.equal(center.markableUnreadCount, 1);
});

test("buildCourseNotificationPayloads maakt publicatiemeldingen voor zichtbare learnerrollen", () => {
  const users = [
    makeUser({ id: "med", role: "MEDEWERKER", audienceProfile: "FYSIOTHERAPEUT" }),
    makeUser({ id: "team", role: "TEAMLEIDER", audienceProfile: "FYSIOTHERAPEUT" }),
    makeUser({ id: "owner", role: "PRAKTIJKHOUDER", audienceProfile: "FYSIOTHERAPEUT" }),
    makeUser({ id: "manager", role: "PRAKTIJKMANAGER", audienceProfile: "FYSIOTHERAPEUT" }),
    makeUser({ id: "fit", role: "MEDEWERKER", audienceProfile: "FITCOACH" }),
    makeUser({ id: "inactive", role: "MEDEWERKER", audienceProfile: "FYSIOTHERAPEUT", isActive: false }),
  ];

  const payloads = buildCourseNotificationPayloads({
    eventType: "published",
    course: {
      id: "course-1",
      title: "Schouderklachten basis",
      slug: "schouderklachten-basis",
      visibleToAll: true,
      visibleToRoles: [],
      visibleToAudienceProfiles: [],
      visibleToUserIds: [],
    },
    users,
  });

  assert.deepEqual(payloads.map((item) => item.userId).sort(), ["fit", "med", "owner", "team"]);
  assert.equal(payloads[0].type, "COURSE_PUBLISHED");
  assert.equal(payloads[0].severity, "SUCCESS");
  assert.equal(payloads[0].href, "/academy/schouderklachten-basis");
});

test("buildCourseNotificationPayloads respecteert doelgroepzichtbaarheid bij cursusupdates", () => {
  const payloads = buildCourseNotificationPayloads({
    eventType: "updated",
    course: {
      id: "course-fit",
      title: "Fitcoach krachttraining",
      slug: "fitcoach-krachttraining",
      visibleToAll: false,
      visibleToRoles: [],
      visibleToAudienceProfiles: ["FITCOACH"],
      visibleToUserIds: ["specific-med"],
    },
    users: [
      makeUser({ id: "fit", role: "MEDEWERKER", audienceProfile: "FITCOACH" }),
      makeUser({ id: "specific-med", role: "MEDEWERKER", audienceProfile: "FYSIOTHERAPEUT" }),
      makeUser({ id: "po", role: "MEDEWERKER", audienceProfile: "PRAKTIJKONDERSTEUNER" }),
      makeUser({ id: "manager-fit", role: "PRAKTIJKMANAGER", audienceProfile: "FITCOACH" }),
    ],
  });

  assert.deepEqual(payloads.map((item) => item.userId).sort(), ["fit", "specific-med"]);
  assert.equal(payloads[0].type, "COURSE_UPDATED");
  assert.equal(payloads[0].severity, "INFO");
  assert.match(payloads[0].body, /bijgewerkt/i);
});

test("buildDeadlineNotifications maakt waarschuwingen voor naderende en verlopen deadlines", () => {
  const now = new Date("2026-05-10T08:00:00Z");
  const notifications = buildDeadlineNotifications({
    now,
    learningGoals: [
      { id: "goal-soon", userId: "u-med", title: "POP afronden", status: "OPEN", targetDate: "2026-05-17", updatedAt: "2026-05-01" },
      { id: "goal-overdue", userId: "u-med", title: "Functioneren voorbereiden", status: "BEZIG", targetDate: "2026-05-01", updatedAt: "2026-05-01" },
      { id: "goal-done", userId: "u-med", title: "Afgerond", status: "AFGEROND", targetDate: "2026-05-12", updatedAt: "2026-05-01" },
    ],
    enrollments: [
      { id: "enroll-soon", userId: "u-med", courseTitle: "Nieuwe e-learning", deadlineAt: new Date("2026-05-20T08:00:00Z"), status: "IN_PROGRESS" },
    ],
    courses: [
      { id: "course-review", title: "Schouderklachten", revisionDueAt: new Date("2026-05-21T08:00:00Z"), status: "PUBLISHED" },
    ],
  });

  assert.deepEqual(notifications.map((item) => item.type), [
    "DEADLINE_APPROACHING",
    "DEADLINE_OVERDUE",
    "DEADLINE_APPROACHING",
    "ACCREDITATION_REVIEW",
  ]);
  assert.equal(notifications.find((item) => item.sourceId === "goal-overdue")?.severity, "CRITICAL");
  assert.equal(notifications.find((item) => item.sourceId === "course-review")?.href, "/academybeheer#accreditatie");
});

test("buildDeadlineNotifications richt cursusreviews op opgegeven beheerders/reviewers", () => {
  const now = new Date("2026-05-11T09:00:00Z");

  const signals = buildDeadlineNotifications({
    now,
    courses: [{ id: "course-1", title: "Accreditatie-ready cursus", revisionDueAt: "2026-05-12", status: "PUBLISHED" }],
    courseAudienceUserIds: ["beheerder-1", "reviewer-1"],
  });

  assert.deepEqual(signals.map((signal) => signal.userId).sort(), ["beheerder-1", "reviewer-1"]);
  assert.equal(signals[0].type, "ACCREDITATION_REVIEW");
  assert.equal(signals[0].href, "/academybeheer#accreditatie");
});
