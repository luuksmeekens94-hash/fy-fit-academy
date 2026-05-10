import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPracticeManagementOverview,
  canAccessPracticeManagement,
} from "../../src/lib/practice-management.ts";
import type { LearningGoal, LibraryDocument, User } from "../../src/lib/types.ts";

const users = [
  user("u1", "Mila Fysio", "MEDEWERKER", true, true),
  user("u2", "Noor Team", "TEAMLEIDER", true, false),
  user("u3", "Bas Admin", "BEHEERDER", true, false),
  user("u4", "Rik Inactief", "MEDEWERKER", false, false),
];

const goals: LearningGoal[] = [
  goal("g1", "u1", "OPEN", "2026-05-20"),
  goal("g2", "u1", "BEZIG", "2026-06-01"),
  goal("g3", "u2", "AFGEROND", "2026-04-01"),
];

const documents: LibraryDocument[] = [
  document("d1", true, "PROTOCOL"),
  document("d2", true, "FORMAT"),
  document("d3", false, "WERKAFSPRAAK"),
];

test("praktijkbeheer is alleen voor praktijkbrede beheerders toegankelijk", () => {
  assert.equal(canAccessPracticeManagement("PRAKTIJKMANAGER"), true);
  assert.equal(canAccessPracticeManagement("PRAKTIJKHOUDER"), true);
  assert.equal(canAccessPracticeManagement("BEHEERDER"), true);

  assert.equal(canAccessPracticeManagement("TEAMLEIDER"), false);
  assert.equal(canAccessPracticeManagement("MEDEWERKER"), false);
  assert.equal(canAccessPracticeManagement("REVIEWER"), false);
});

test("praktijkmanager overzicht bundelt beheerflows zonder persoonlijke LMS-laag", () => {
  const overview = buildPracticeManagementOverview({ users, goals, documents });

  assert.deepEqual(overview.metrics, {
    activeTeamMembers: 2,
    onboardingMembers: 1,
    openDevelopmentGoals: 2,
    publishedDocuments: 2,
  });

  assert.deepEqual(
    overview.workflows.map((workflow) => workflow.key),
    ["announcements", "deadlines", "conversations", "reports", "library"],
  );
  assert.equal(overview.workflows.some((workflow) => workflow.href.startsWith("/academy")), false);
  assert.equal(overview.workflows.some((workflow) => workflow.href.startsWith("/ontwikkeling")), false);
});

function user(
  id: string,
  name: string,
  role: User["role"],
  isActive: boolean,
  isOnboarding: boolean,
): User {
  return {
    id,
    name,
    email: `${id}@example.test`,
    role,
    audienceProfile: "FYSIOTHERAPEUT",
    title: "Fysiotherapeut",
    location: "Nijmegen",
    isActive,
    isOnboarding,
    bio: "",
    avatarColor: "#fff",
  };
}

function goal(id: string, userId: string, status: LearningGoal["status"], targetDate: string): LearningGoal {
  return {
    id,
    userId,
    title: id,
    description: "",
    status,
    targetDate,
    updatedAt: "2026-05-10",
  };
}

function document(id: string, isPublished: boolean, type: LibraryDocument["type"]): LibraryDocument {
  return {
    id,
    title: id,
    type,
    categoryId: "cat",
    version: "1.0",
    ownerId: "u2",
    isPublished,
    updatedAt: "2026-05-10",
    summary: "",
    content: "",
    tags: [],
  };
}
