import test from "node:test";
import assert from "node:assert/strict";

import {
  getActiveAssessmentAttempt,
  getLatestCompletedAssessmentAttempt,
  getRemainingAssessmentAttempts,
} from "../../../src/lib/lms/assessment-runner-helpers.ts";

test("getActiveAssessmentAttempt returns the latest unsubmitted attempt", () => {
  const attempt = getActiveAssessmentAttempt([
    {
      id: "attempt-1",
      attemptNumber: 1,
      startedAt: new Date("2026-04-16T09:00:00.000Z"),
      submittedAt: new Date("2026-04-16T09:05:00.000Z"),
      scoreRaw: 4,
      scorePercentage: 80,
      passed: true,
    },
    {
      id: "attempt-2",
      attemptNumber: 2,
      startedAt: new Date("2026-04-16T10:00:00.000Z"),
      submittedAt: null,
      scoreRaw: null,
      scorePercentage: null,
      passed: null,
    },
  ]);

  assert.equal(attempt?.id, "attempt-2");
});

test("getLatestCompletedAssessmentAttempt returns the highest submitted attempt", () => {
  const attempt = getLatestCompletedAssessmentAttempt([
    {
      id: "attempt-1",
      attemptNumber: 1,
      startedAt: new Date("2026-04-16T09:00:00.000Z"),
      submittedAt: new Date("2026-04-16T09:05:00.000Z"),
      scoreRaw: 2,
      scorePercentage: 40,
      passed: false,
    },
    {
      id: "attempt-2",
      attemptNumber: 2,
      startedAt: new Date("2026-04-16T10:00:00.000Z"),
      submittedAt: null,
      scoreRaw: null,
      scorePercentage: null,
      passed: null,
    },
    {
      id: "attempt-3",
      attemptNumber: 3,
      startedAt: new Date("2026-04-16T11:00:00.000Z"),
      submittedAt: new Date("2026-04-16T11:07:00.000Z"),
      scoreRaw: 5,
      scorePercentage: 100,
      passed: true,
    },
  ]);

  assert.equal(attempt?.id, "attempt-3");
});

test("getRemainingAssessmentAttempts counts both submitted and active attempts", () => {
  const remaining = getRemainingAssessmentAttempts(3, [
    {
      id: "attempt-1",
      attemptNumber: 1,
      startedAt: new Date("2026-04-16T09:00:00.000Z"),
      submittedAt: new Date("2026-04-16T09:05:00.000Z"),
      scoreRaw: 2,
      scorePercentage: 40,
      passed: false,
    },
    {
      id: "attempt-2",
      attemptNumber: 2,
      startedAt: new Date("2026-04-16T10:00:00.000Z"),
      submittedAt: null,
      scoreRaw: null,
      scorePercentage: null,
      passed: null,
    },
  ]);

  assert.equal(remaining, 1);
});
