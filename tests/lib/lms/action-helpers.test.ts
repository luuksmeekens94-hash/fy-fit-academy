import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAssessmentAnswerRecords,
  resolveEnrollmentStatusAfterLessonCompletion,
} from "../../../src/lib/lms/action-helpers.ts";

test("buildAssessmentAnswerRecords scores single and multiple response questions correctly", () => {
  const result = buildAssessmentAnswerRecords({
    questions: [
      {
        id: "question-1",
        type: "MULTIPLE_CHOICE",
        points: 1,
        options: [
          { id: "option-a", isCorrect: false },
          { id: "option-b", isCorrect: true },
        ],
      },
      {
        id: "question-2",
        type: "MULTIPLE_RESPONSE",
        points: 2,
        options: [
          { id: "option-c", isCorrect: true },
          { id: "option-d", isCorrect: false },
          { id: "option-e", isCorrect: true },
        ],
      },
    ],
    responses: {
      "question-1": ["option-b"],
      "question-2": ["option-c", "option-e"],
    },
    passPercentage: 75,
  });

  assert.equal(result.scoreRaw, 3);
  assert.equal(result.scorePercentage, 100);
  assert.equal(result.passed, true);
  assert.equal(result.answers.length, 2);
  assert.equal(result.answers[0]?.isCorrect, true);
  assert.equal(result.answers[1]?.awardedPoints, 2);
});

test("buildAssessmentAnswerRecords gives zero points to open text answers for MVP", () => {
  const result = buildAssessmentAnswerRecords({
    questions: [
      {
        id: "question-1",
        type: "OPEN_TEXT",
        points: 3,
        options: [],
      },
    ],
    responses: {
      "question-1": { textAnswer: "Ik zou de patiënt eerst samenvatten wat ik gezien heb." },
    },
    passPercentage: 100,
  });

  assert.equal(result.scoreRaw, 0);
  assert.equal(result.scorePercentage, 0);
  assert.equal(result.passed, false);
  assert.equal(result.answers[0]?.textAnswer, "Ik zou de patiënt eerst samenvatten wat ik gezien heb.");
  assert.equal(result.answers[0]?.awardedPoints, 0);
});

test("resolveEnrollmentStatusAfterLessonCompletion upgrades not-started enrollment to in-progress", () => {
  const result = resolveEnrollmentStatusAfterLessonCompletion({
    currentStatus: "NOT_STARTED",
    courseCompleted: false,
  });

  assert.deepEqual(result, {
    status: "IN_PROGRESS",
    shouldSetStartedAt: true,
    shouldSetCompletedAt: false,
  });
});

test("resolveEnrollmentStatusAfterLessonCompletion marks the enrollment completed when rules pass", () => {
  const result = resolveEnrollmentStatusAfterLessonCompletion({
    currentStatus: "IN_PROGRESS",
    courseCompleted: true,
  });

  assert.deepEqual(result, {
    status: "COMPLETED",
    shouldSetStartedAt: false,
    shouldSetCompletedAt: true,
  });
});
