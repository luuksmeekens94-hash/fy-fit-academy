import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAcademyOverview,
  getAcademyOverviewCopy,
} from "../../../src/lib/academy/overview.ts";
import type { AcademyCourseCardView } from "../../../src/lib/academy/types.ts";

function makeCourse(overrides: Partial<AcademyCourseCardView> = {}): AcademyCourseCardView {
  return {
    id: overrides.id ?? "course-1",
    slug: overrides.slug ?? "basis",
    title: overrides.title ?? "Basis consultvoering",
    description: overrides.description ?? "Leer klinisch redeneren in de Fy-Fit praktijk.",
    goal: overrides.goal ?? "Je past richtlijnen toe in een eerste consult.",
    progressPercentage: overrides.progressPercentage ?? 0,
    progressLabel: overrides.progressLabel ?? `${overrides.progressPercentage ?? 0}% afgerond`,
    studyLoadMinutes: overrides.studyLoadMinutes ?? 45,
    assignmentLabel: overrides.assignmentLabel ?? "Need to know",
    deadlineAt: overrides.deadlineAt ?? null,
    status: overrides.status ?? "NOT_STARTED",
    ctaLabel: overrides.ctaLabel ?? "Start e-learning",
    href: overrides.href ?? "/academy/basis",
  };
}

test("academy overzichtcopy is doelgroepgericht zonder rol/autorisatie te mengen", () => {
  const fysio = getAcademyOverviewCopy("FYSIOTHERAPEUT");
  const praktijkondersteuner = getAcademyOverviewCopy("PRAKTIJKONDERSTEUNER");
  const fitcoach = getAcademyOverviewCopy("FITCOACH");

  assert.match(fysio.title, /fysiotherapeut/i);
  assert.match(fysio.description, /richtlijnen|klinisch redeneren/i);
  assert.match(praktijkondersteuner.title, /praktijkondersteuner/i);
  assert.match(praktijkondersteuner.description, /communicatie|werkafspraken|avg/i);
  assert.match(fitcoach.title, /fitcoach/i);
  assert.match(fitcoach.description, /coaching|leefstijl|training/i);

  const allText = [fysio, praktijkondersteuner, fitcoach]
    .flatMap((copy) => [copy.title, copy.description, copy.emptyStateTitle, copy.emptyStateText, ...copy.focusTags])
    .join(" ")
    .toLowerCase();

  assert.doesNotMatch(allText, /planning|declaratie|declaraties|epd/);
});

test("academy overzicht groepeert voortgang en aanbevelingen in learner-first secties", () => {
  const overview = buildAcademyOverview("FYSIOTHERAPEUT", [
    makeCourse({ id: "1", title: "Schouder richtlijn", status: "IN_PROGRESS", progressPercentage: 45, progressLabel: "45% afgerond", assignmentLabel: "Need to know" }),
    makeCourse({ id: "2", title: "Reflectie", status: "NOT_STARTED", assignmentLabel: "Nice to know" }),
    makeCourse({ id: "3", title: "AVG basis", status: "COMPLETED", progressPercentage: 100, progressLabel: "100% afgerond" }),
    makeCourse({ id: "4", title: "Knie intake", status: "NOT_STARTED", assignmentLabel: "Need to know" }),
  ]);

  assert.deepEqual(overview.stats, {
    total: 4,
    inProgress: 1,
    completed: 1,
    needToKnow: 3,
  });
  assert.deepEqual(
    overview.sections.map((section) => section.id),
    ["continue", "recommended", "completed", "all"],
  );
  assert.deepEqual(overview.sections[0]?.courses.map((course) => course.id), ["1"]);
  assert.deepEqual(overview.sections[1]?.courses.map((course) => course.id), ["4"]);
  assert.deepEqual(overview.sections[2]?.courses.map((course) => course.id), ["3"]);
  assert.deepEqual(overview.sections[3]?.courses.map((course) => course.id), ["2"]);
});

test("academy overzicht zet zoekresultaten centraal en geeft passend leegbericht", () => {
  const courses = [
    makeCourse({ id: "1", title: "Schouder richtlijn", description: "Klinisch redeneren" }),
    makeCourse({ id: "2", title: "Coaching basis", description: "Leefstijl en training" }),
  ];

  const filtered = buildAcademyOverview("FITCOACH", courses, "coaching");
  assert.equal(filtered.isSearching, true);
  assert.equal(filtered.sections.length, 1);
  assert.equal(filtered.sections[0]?.title, "Zoekresultaten");
  assert.deepEqual(filtered.sections[0]?.courses.map((course) => course.id), ["2"]);

  const empty = buildAcademyOverview("FITCOACH", courses, "onvindbaar");
  assert.equal(empty.sections.length, 0);
  assert.match(empty.emptyState.title, /Geen zoekresultaten/i);
  assert.match(empty.emptyState.text, /fitcoach/i);
});

test("academy overzicht geeft nieuwe array/object instanties terug", () => {
  const firstCopy = getAcademyOverviewCopy("PRAKTIJKONDERSTEUNER");
  firstCopy.focusTags.push("Mutatie");

  const secondCopy = getAcademyOverviewCopy("PRAKTIJKONDERSTEUNER");
  assert.doesNotMatch(secondCopy.focusTags.join(" "), /Mutatie/);

  const courses = [makeCourse({ id: "1", status: "NOT_STARTED" })];
  const firstOverview = buildAcademyOverview("PRAKTIJKONDERSTEUNER", courses);
  firstOverview.sections[0]?.courses.push(makeCourse({ id: "mutatie" }));

  const secondOverview = buildAcademyOverview("PRAKTIJKONDERSTEUNER", courses);
  assert.equal(secondOverview.sections[0]?.courses.length, 1);
});
