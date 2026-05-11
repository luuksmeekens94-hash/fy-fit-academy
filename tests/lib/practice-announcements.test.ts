import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAnnouncementNotificationPayloads,
  canManagePracticeAnnouncements,
  parseAnnouncementDraftInput,
} from "../../src/lib/practice-announcements";
import type { User } from "../../src/lib/types";

function user(overrides: Partial<User>): User {
  return {
    id: "u-1",
    name: "Gebruiker",
    email: "user@example.com",
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

test("alleen praktijkbrede rollen mogen mededelingen beheren", () => {
  assert.equal(canManagePracticeAnnouncements("PRAKTIJKMANAGER"), true);
  assert.equal(canManagePracticeAnnouncements("PRAKTIJKHOUDER"), true);
  assert.equal(canManagePracticeAnnouncements("BEHEERDER"), true);
  assert.equal(canManagePracticeAnnouncements("TEAMLEIDER"), false);
  assert.equal(canManagePracticeAnnouncements("MEDEWERKER"), false);
  assert.equal(canManagePracticeAnnouncements("REVIEWER"), false);
});

test("parseAnnouncementDraftInput valideert en normaliseert mededelingformulier", () => {
  const formData = new FormData();
  formData.set("title", "  Nieuwe e-learning klaar  ");
  formData.set("body", "Vanaf maandag staat de nieuwe e-learning klaar.");
  formData.set("priority", "URGENT");
  formData.set("targetRoles", "MEDEWERKER");
  formData.append("targetAudienceProfiles", "FYSIOTHERAPEUT");
  formData.append("targetAudienceProfiles", "FITCOACH");
  formData.set("visibleToAll", "false");

  const parsed = parseAnnouncementDraftInput(formData);

  assert.deepEqual(parsed, {
    title: "Nieuwe e-learning klaar",
    body: "Vanaf maandag staat de nieuwe e-learning klaar.",
    priority: "URGENT",
    visibleToAll: false,
    targetRoles: ["MEDEWERKER"],
    targetAudienceProfiles: ["FYSIOTHERAPEUT", "FITCOACH"],
    targetUserIds: [],
    publishAt: null,
    expiresAt: null,
  });
});

test("parseAnnouncementDraftInput weigert lege titel of tekst", () => {
  const formData = new FormData();
  formData.set("title", "");
  formData.set("body", "Te kort");

  assert.throws(() => parseAnnouncementDraftInput(formData), /Titel is verplicht/);
});

test("buildAnnouncementNotificationPayloads maakt notificaties voor de juiste doelgroep", () => {
  const recipients = [
    user({ id: "med", role: "MEDEWERKER", audienceProfile: "FYSIOTHERAPEUT" }),
    user({ id: "pm", role: "PRAKTIJKMANAGER", audienceProfile: "PRAKTIJKONDERSTEUNER" }),
    user({ id: "fit", role: "MEDEWERKER", audienceProfile: "FITCOACH" }),
    user({ id: "review", role: "REVIEWER", audienceProfile: "FYSIOTHERAPEUT" }),
  ];

  const notifications = buildAnnouncementNotificationPayloads({
    announcement: {
      id: "ann-1",
      title: "Nieuwe e-learning",
      body: "Er staat een nieuwe e-learning klaar.",
      priority: "IMPORTANT",
      visibleToAll: false,
      targetRoles: ["MEDEWERKER"],
      targetAudienceProfiles: ["FITCOACH"],
      targetUserIds: [],
    },
    users: recipients,
  });

  assert.deepEqual(notifications.map((item) => item.userId).sort(), ["fit", "med"]);
  assert.equal(notifications[0].type, "ANNOUNCEMENT");
  assert.equal(notifications[0].severity, "WARNING");
  assert.equal(notifications[0].href, "/#nieuws-signalen");
});
