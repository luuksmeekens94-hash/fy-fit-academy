import assert from "node:assert/strict";
import test from "node:test";

import { buildAcademyDashboardModel, getAcademyAssignmentLabel } from "../../../src/lib/academy/dashboard.ts";
import type { AcademyCourseCardView } from "../../../src/lib/academy/types.ts";

function makeCourse(overrides: Partial<AcademyCourseCardView> = {}): AcademyCourseCardView {
  return {
    id: "course-1",
    slug: "course-1",
    title: "Voorbeeld e-learning",
    description: "Praktische voorbeeldinhoud.",
    goal: null,
    progressPercentage: 0,
    progressLabel: "Nog niet gestart",
    studyLoadMinutes: 45,
    assignmentLabel: "Nice to know",
    deadlineAt: null,
    status: "NOT_STARTED",
    ctaLabel: "Start e-learning",
    href: "/academy/course-1",
    ...overrides,
  };
}

const stats = {
  total: 3,
  inProgress: 1,
  completed: 1,
  needToKnow: 1,
};

test("dashboard vertaalt technische toewijzingslabels naar heldere Nederlandse labels", () => {
  assert.equal(getAcademyAssignmentLabel("Need to know"), "Verplicht");
  assert.equal(getAcademyAssignmentLabel("Nice to know"), "Verdieping");
  assert.equal(getAcademyAssignmentLabel("Anders"), "Anders");
});

test("dashboard gebruikt de eerste actieve e-learning als primaire vervolgactie zonder duplicatie", () => {
  const active = makeCourse({
    id: "active",
    title: "Actieve e-learning",
    status: "IN_PROGRESS",
    progressPercentage: 45,
    progressLabel: "45% afgerond",
  });
  const secondActive = makeCourse({ id: "active-2", title: "Tweede actieve e-learning", status: "IN_PROGRESS" });

  const model = buildAcademyDashboardModel({
    isSearching: false,
    stats,
    sections: [
      { id: "continue", title: "Ga verder", description: "Actief", courses: [active, secondActive] },
    ],
  });

  assert.equal(model.primaryCourse?.id, "active");
  assert.deepEqual(model.sections[0]?.courses.map((course) => course.id), ["active-2"]);
});

test("dashboard valt zonder actieve cursus terug op de eerste aanbevolen e-learning", () => {
  const recommended = makeCourse({ id: "recommended", assignmentLabel: "Need to know" });

  const model = buildAcademyDashboardModel({
    isSearching: false,
    stats,
    sections: [
      { id: "recommended", title: "Aanbevolen", description: "Voor jou", courses: [recommended] },
      { id: "all", title: "Verder beschikbaar", description: "Overig", courses: [makeCourse({ id: "other" })] },
    ],
  });

  assert.equal(model.primaryCourse?.id, "recommended");
  assert.deepEqual(model.sections.map((section) => section.id), ["all"]);
});

test("dashboard toont tijdens zoeken geen losse primaire cursus en behoudt zoekresultaten", () => {
  const result = makeCourse({ id: "result", title: "Zoekresultaat" });

  const model = buildAcademyDashboardModel({
    isSearching: true,
    stats,
    sections: [
      { id: "search", title: "Zoekresultaten", description: "Gevonden", courses: [result] },
    ],
  });

  assert.equal(model.primaryCourse, null);
  assert.deepEqual(model.sections[0]?.courses.map((course) => course.id), ["result"]);
});

test("dashboardmodel kloont secties, cursussen en statistieken", () => {
  const course = makeCourse({ id: "immutable", status: "COMPLETED" });
  const source = {
    isSearching: false,
    stats,
    sections: [
      { id: "completed", title: "Afgerond", description: "Terugkijken", courses: [course] },
    ],
  };

  const model = buildAcademyDashboardModel(source);
  model.sections[0]?.courses.push(makeCourse({ id: "mutatie" }));
  model.stats.total = 99;

  assert.equal(source.sections[0]?.courses.length, 1);
  assert.equal(source.stats.total, 3);
});
