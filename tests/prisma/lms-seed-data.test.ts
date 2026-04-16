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
