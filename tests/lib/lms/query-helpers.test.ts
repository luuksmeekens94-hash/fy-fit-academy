import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateCourseProgress,
  selectLatestPassedAttempt,
} from "../../../src/lib/lms/query-helpers.ts";

test("calculateCourseProgress returns rounded percentage for completed lessons in the active course", () => {
  const progress = calculateCourseProgress({
    lessonIds: ["lesson-1", "lesson-2", "lesson-3"],
    completedLessonIds: ["lesson-1", "lesson-3", "other-course-lesson"],
  });

  assert.equal(progress, 67);
});

test("calculateCourseProgress returns 0 when a course has no lessons", () => {
  const progress = calculateCourseProgress({
    lessonIds: [],
    completedLessonIds: ["lesson-1"],
  });

  assert.equal(progress, 0);
});

test("selectLatestPassedAttempt returns the highest passed attempt number", () => {
  const attempt = selectLatestPassedAttempt([
    {
      id: "attempt-1",
      attemptNumber: 1,
      startedAt: new Date("2026-04-01T09:00:00.000Z"),
      submittedAt: new Date("2026-04-01T09:15:00.000Z"),
      scoreRaw: 3,
      scorePercentage: 60,
      passed: false,
    },
    {
      id: "attempt-2",
      attemptNumber: 2,
      startedAt: new Date("2026-04-01T10:00:00.000Z"),
      submittedAt: new Date("2026-04-01T10:12:00.000Z"),
      scoreRaw: 4,
      scorePercentage: 80,
      passed: true,
    },
    {
      id: "attempt-3",
      attemptNumber: 3,
      startedAt: new Date("2026-04-01T11:00:00.000Z"),
      submittedAt: new Date("2026-04-01T11:12:00.000Z"),
      scoreRaw: 5,
      scorePercentage: 100,
      passed: true,
    },
  ]);

  assert.equal(attempt?.id, "attempt-3");
});

test("selectLatestPassedAttempt returns null when nothing passed", () => {
  const attempt = selectLatestPassedAttempt([
    {
      id: "attempt-1",
      attemptNumber: 1,
      startedAt: new Date("2026-04-01T09:00:00.000Z"),
      submittedAt: new Date("2026-04-01T09:15:00.000Z"),
      scoreRaw: 3,
      scorePercentage: 60,
      passed: false,
    },
  ]);

  assert.equal(attempt, null);
});
