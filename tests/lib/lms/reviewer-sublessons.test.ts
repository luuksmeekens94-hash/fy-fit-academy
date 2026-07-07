import test from "node:test";
import assert from "node:assert/strict";

import {
  buildReviewerModuleProgress,
  buildReviewerModuleStepLinks,
  buildReviewerTheorySubLessons,
  getAssignmentStepKey,
  getKnowledgeCheckStepKey,
} from "../../../src/lib/lms/reviewer-sublessons.ts";

test("buildReviewerTheorySubLessons splitst modulecontent in losse lesstappen", () => {
  const subLessons = buildReviewerTheorySubLessons(`Intro module 1

Les 1.1: pijneducatie
Tekst bij les 1.1

Les 1.2: homeostasemodel
Tekst bij les 1.2`);

  assert.deepEqual(subLessons.map((lesson) => lesson.label), ["Les 1.1", "Les 1.2"]);
  assert.equal(subLessons[0].key, "les-1-1");
  assert.match(subLessons[0].text, /Intro module 1/);
});

test("buildReviewerModuleStepLinks maakt compacte links naar lessen, opdracht en kennischeck", () => {
  const links = buildReviewerModuleStepLinks({
    id: "lesson-1",
    title: "Module 1: PFP begrijpen",
    order: 1,
    type: "TEXT",
    content: `Les 1.1: pijneducatie
Tekst

Les 1.4: homeostasemodel
Tekst`,
  });

  assert.deepEqual(
    links.map((link) => [link.label, link.hrefSuffix]),
    [
      ["Les 1.1", "?les=les-1-1"],
      ["Les 1.4", "?les=les-1-4"],
      ["Opdracht", "?stap=opdracht"],
      ["Kennischeck", "?stap=toetsvragen"],
    ],
  );
});

test("buildReviewerModuleProgress hervat bij de eerste nog open stap", () => {
  const lesson = {
    id: "lesson-1",
    title: "Module 1: PFP begrijpen",
    order: 1,
    type: "TEXT",
    content: `Les 1.1: pijneducatie
Tekst

Les 1.2: homeostasemodel
Tekst`,
  };
  const progress = buildReviewerModuleProgress({
    lessons: [lesson],
    completedStepKeysByLessonId: new Map([
      [lesson.id, new Set(["les-1-1", "les-1-2", getAssignmentStepKey("1")])],
    ]),
    submittedAssignmentLessonIds: new Set(),
  });

  assert.equal(progress[0].percentage, 75);
  assert.equal(progress[0].nextStepLabel, "Kennischeck");
  assert.equal(progress[0].nextStepHrefSuffix, "?stap=toetsvragen");
});

test("buildReviewerModuleProgress telt ingeleverde opdracht mee", () => {
  const lesson = {
    id: "lesson-2",
    title: "Module 2: diagnostiek",
    order: 2,
    type: "TEXT",
    content: "Les 2.1: DSDT\nTekst",
  };
  const progress = buildReviewerModuleProgress({
    lessons: [lesson],
    completedStepKeysByLessonId: new Map([[lesson.id, new Set(["les-2-1", getKnowledgeCheckStepKey("2")])]]),
    submittedAssignmentLessonIds: new Set([lesson.id]),
  });

  assert.equal(progress[0].completedSteps, 3);
  assert.equal(progress[0].isCompleted, true);
});
