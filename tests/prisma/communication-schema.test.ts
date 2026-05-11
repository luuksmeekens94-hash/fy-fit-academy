import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");

test("schema bevat mededelingen en notificaties voor cockpit-signalen", () => {
  for (const token of [
    "enum AnnouncementStatus",
    "enum AnnouncementPriority",
    "enum NotificationType",
    "enum NotificationSeverity",
    "model Announcement",
    "model Notification",
    "announcementsCreated",
    "announcementsPublished",
    "notifications",
  ]) {
    assert.match(schema, new RegExp(token));
  }
});

test("notificaties hebben user/read indexes voor snelle badge/feed queries", () => {
  assert.match(schema, /@@index\(\[userId, readAt, createdAt\]\)/);
  assert.match(schema, /@@index\(\[type, createdAt\]\)/);
});
