import test from "node:test";
import assert from "node:assert/strict";

import { canStartAssessmentResitAfterFailedAttempt } from "../../../src/lib/lms/assessment-redo-policy.ts";

const failedAt = new Date("2026-05-15T09:00:00.000Z");

const requiredLessons = [
  { id: "lesson-1", isRequired: true, type: "TEXT" as const },
  { id: "lesson-2", isRequired: true, type: "CASE" as const },
  { id: "lesson-3", isRequired: true, type: "ASSESSMENT" as const },
];

test("canStartAssessmentResitAfterFailedAttempt allows first attempts without a failed attempt", () => {
  assert.equal(
    canStartAssessmentResitAfterFailedAttempt({
      latestFailedAttemptSubmittedAt: null,
      requiredLessons,
      progressEntries: [],
    }),
    true,
  );
});

test("canStartAssessmentResitAfterFailedAttempt blocks resits until required learning lessons are completed after failure", () => {
  assert.equal(
    canStartAssessmentResitAfterFailedAttempt({
      latestFailedAttemptSubmittedAt: failedAt,
      requiredLessons,
      progressEntries: [
        { lessonId: "lesson-1", completedAt: new Date("2026-05-15T08:00:00.000Z") },
        { lessonId: "lesson-2", completedAt: new Date("2026-05-15T09:10:00.000Z") },
      ],
    }),
    false,
  );
});

test("canStartAssessmentResitAfterFailedAttempt allows resits after all required learning lessons were redone", () => {
  assert.equal(
    canStartAssessmentResitAfterFailedAttempt({
      latestFailedAttemptSubmittedAt: failedAt,
      requiredLessons,
      progressEntries: [
        { lessonId: "lesson-1", completedAt: new Date("2026-05-15T09:05:00.000Z") },
        { lessonId: "lesson-2", completedAt: new Date("2026-05-15T09:10:00.000Z") },
      ],
    }),
    true,
  );
});
