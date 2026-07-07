import test from "node:test";
import assert from "node:assert/strict";

import { buildEvaluationAnswerRecords, summarizeEvaluationRatings } from "../../../src/lib/lms/evaluation.ts";

const questions = [
  { id: "q1", label: "Relevantie", type: "SCALE_1_5" as const, isRequired: true },
  { id: "q2", label: "Verbeterpunt", type: "TEXT" as const, isRequired: false },
  { id: "q3", label: "Aanbevolen", type: "YES_NO" as const, isRequired: true },
  { id: "q4", label: "Algemene indruk", type: "SCALE_1_10" as const, isRequired: true },
];

test("buildEvaluationAnswerRecords bouwt rating, tekst en ja/nee antwoorden", () => {
  const values = new Map([
    ["question-q1", "5"],
    ["question-q2", "Maak module 2 iets compacter."],
    ["question-q3", "yes"],
    ["question-q4", "9"],
  ]);

  assert.deepEqual(buildEvaluationAnswerRecords(questions, (name) => values.get(name)), [
    { evaluationQuestionId: "q1", rating: 5 },
    { evaluationQuestionId: "q2", text: "Maak module 2 iets compacter." },
    { evaluationQuestionId: "q3", booleanValue: true },
    { evaluationQuestionId: "q4", rating: 9 },
  ]);
});

test("buildEvaluationAnswerRecords valideert verplichte evaluatievragen", () => {
  assert.throws(
    () => buildEvaluationAnswerRecords(questions, () => ""),
    /Vul de vraag "Relevantie" in/,
  );
});

test("buildEvaluationAnswerRecords weigert ratings buiten 1 tot en met 5", () => {
  const values = new Map([
    ["question-q1", "6"],
    ["question-q3", "no"],
    ["question-q4", "9"],
  ]);

  assert.throws(
    () => buildEvaluationAnswerRecords(questions, (name) => values.get(name)),
    /score van 1 tot en met 5/,
  );
});

test("buildEvaluationAnswerRecords weigert 1-10 ratings buiten bereik", () => {
  const values = new Map([
    ["question-q1", "5"],
    ["question-q3", "yes"],
    ["question-q4", "11"],
  ]);

  assert.throws(
    () => buildEvaluationAnswerRecords(questions, (name) => values.get(name)),
    /score van 1 tot en met 10/,
  );
});

test("summarizeEvaluationRatings berekent inzendingen en gemiddelde score", () => {
  const summary = summarizeEvaluationRatings([
    { answers: [{ rating: 5 }, { rating: 4 }, { rating: null }] },
    { answers: [{ rating: 3 }] },
  ]);

  assert.deepEqual(summary, {
    submissionCount: 2,
    ratingCount: 3,
    averageRating: 4,
  });
});
