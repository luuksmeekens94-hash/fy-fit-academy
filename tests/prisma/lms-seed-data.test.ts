import test from "node:test";
import assert from "node:assert/strict";

import { buildLmsSeedSpec } from "../../prisma/lms-seed-data.ts";

test("buildLmsSeedSpec returns a published MVP LMS course with lessons, assessment and reporting fixtures", () => {
  const spec = buildLmsSeedSpec();

  assert.equal(spec.course.slug, "fy-fit-consultvoering-basis");
  assert.equal(spec.course.status, "PUBLISHED");
  assert.equal(spec.version.versionNumber, "1.0");

  assert.equal(spec.lessons.length, 5);
  assert.equal(spec.assessment.questions.length, 5);
  assert.equal(spec.enrollmentFixtures.length, 2);
  assert.equal(spec.certificateFixture.courseVersionNumber, "1.0");
});


test("buildLmsSeedSpec adds Academy intro fields for goal, focus and learner outcomes", () => {
  const spec = buildLmsSeedSpec();

  assert.equal(typeof spec.course.goal, "string");
  assert.equal(typeof spec.course.focus, "string");
  assert.equal(Array.isArray(spec.course.learnerOutcomes), true);
  assert.equal(spec.course.learnerOutcomes.length > 0, true);
});

test("buildLmsSeedSpec includes exactly one completed fixture and one in-progress fixture", () => {
  const spec = buildLmsSeedSpec();

  const completedFixtures = spec.enrollmentFixtures.filter(
    (fixture) => fixture.status === "COMPLETED"
  );
  const inProgressFixtures = spec.enrollmentFixtures.filter(
    (fixture) => fixture.status === "IN_PROGRESS"
  );

  assert.equal(completedFixtures.length, 1);
  assert.equal(inProgressFixtures.length, 1);
});

test("buildLmsSeedSpec marks the assessment as required for course completion", () => {
  const spec = buildLmsSeedSpec();

  assert.equal(spec.assessment.isRequiredForCompletion, true);
  assert.equal(spec.assessment.questions.every((question) => question.options.length >= 2), true);
});

test("buildLmsSeedSpec includes accreditation metadata required by Kwaliteitshuis", () => {
  const spec = buildLmsSeedSpec();

  assert.equal(spec.course.accreditationRegister, "KRF NL / SKF Fysiotherapie");
  assert.equal(spec.course.accreditationKind, "VAKINHOUDELIJK");
  assert.equal(spec.course.versionDate, "2026-04-01T08:00:00.000Z");
  assert.equal(spec.course.requiredQuestionCount, 5);
  assert.equal(spec.course.authorExperts.length >= 1, true);
  assert.equal(spec.course.authorExperts[0].name.length > 0, true);
});

test("buildLmsSeedSpec includes module structure with objectives, work forms and literature", () => {
  const spec = buildLmsSeedSpec();

  assert.equal(spec.modules.length >= 1, true);
  assert.equal(spec.modules[0].title, "Consultvoering volgens Fy-fit stijl");
  assert.equal(spec.modules[0].workForms.includes("TEKST"), true);
  assert.equal(spec.modules[0].lessonSlugs.length, spec.lessons.length);
  assert.equal(spec.learningObjectives.length, 3);
  assert.equal(
    spec.learningObjectives.every((objective) => objective.text.startsWith("Na afloop kan de deelnemer")),
    true
  );
  assert.equal(spec.literatureReferences.length >= 1, true);
  assert.equal(spec.competencyReferences.length >= 1, true);
});

test("buildLmsSeedSpec links assessment questions to learning objectives", () => {
  const spec = buildLmsSeedSpec();
  const objectiveCodes = new Set(spec.learningObjectives.map((objective) => objective.code));

  assert.equal(
    spec.assessment.questions.every(
      (question) =>
        question.learningObjectiveCodes.length >= 1 &&
        question.learningObjectiveCodes.every((code) => objectiveCodes.has(code))
    ),
    true
  );
});

test("buildLmsSeedSpec includes a required standard evaluation form", () => {
  const spec = buildLmsSeedSpec();
  const labels = spec.evaluationForm.questions.map((question) => question.label);

  assert.equal(spec.evaluationForm.isRequired, true);
  assert.deepEqual(labels, [
    "Niveau/diepgang",
    "Relevantie voor de praktijk",
    "Toepasbaarheid",
    "Kwaliteit van de leerstof",
    "Toets passend bij de leerstof",
    "Geschatte versus werkelijke studielast",
    "Verbeterpunten",
  ]);
});
