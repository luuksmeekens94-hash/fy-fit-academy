import test from "node:test";
import assert from "node:assert/strict";

import {
  DEMO_ELEARNING_ASSET_ROOT,
  DEMO_ELEARNING_COURSE_SLUG,
  buildDemoElearningSeedSpec,
} from "../../prisma/demo-elearning-seed-data.ts";

test("buildDemoElearningSeedSpec returns a removable temporary demo course for the accredited e-learning", () => {
  const spec = buildDemoElearningSeedSpec();

  assert.equal(spec.course.slug, DEMO_ELEARNING_COURSE_SLUG);
  assert.match(spec.course.title, /tijdelijke demo/i);
  assert.equal(spec.course.status, "PUBLISHED");
  assert.equal(spec.course.isMandatory, false);
  assert.equal(spec.version.isActive, true);
  assert.equal(spec.cleanup.assetRoot, DEMO_ELEARNING_ASSET_ROOT);
});

test("demo seed includes Sprint 12A module 1 with goal, focus, objectives, video, images and lessons", () => {
  const spec = buildDemoElearningSeedSpec();
  const module1 = spec.modules.find((module) => module.key === "module-1-complexiteit");

  assert.ok(module1);
  assert.equal(module1.title, "Module 1: Complexiteit in de manuele therapie");
  assert.equal(module1.workForms.includes("VIDEO"), true);
  assert.equal(module1.workForms.includes("TEKST"), true);
  assert.equal(module1.workForms.includes("CASUS"), true);
  assert.equal(module1.workForms.includes("REFLECTIE"), true);
  assert.equal(module1.workForms.includes("TOETS"), true);

  assert.equal(spec.learningObjectives.filter((objective) => objective.moduleKey === module1.key).length, 6);
  assert.equal(spec.lessons.filter((lesson) => module1.lessonSlugs.includes(lesson.slug)).length, module1.lessonSlugs.length);

  const videoLesson = spec.lessons.find((lesson) => lesson.slug === "module-1-video-complexiteit");
  assert.ok(videoLesson);
  assert.equal(videoLesson.type, "VIDEO");
  assert.equal(videoLesson.assetPath, `${DEMO_ELEARNING_ASSET_ROOT}/module-1/module-1-complexiteit.mp4`);

  assert.deepEqual(module1.assetPaths, [
    `${DEMO_ELEARNING_ASSET_ROOT}/module-1/images/image1.png`,
    `${DEMO_ELEARNING_ASSET_ROOT}/module-1/images/image2.png`,
    `${DEMO_ELEARNING_ASSET_ROOT}/module-1/images/image3.png`,
    `${DEMO_ELEARNING_ASSET_ROOT}/module-1/images/image4.png`,
  ]);
});

test("demo module 1 assessment follows accreditation rules and links every question to objectives", () => {
  const spec = buildDemoElearningSeedSpec();
  const objectiveCodes = new Set(spec.learningObjectives.map((objective) => objective.code));

  assert.equal(spec.assessment.passPercentage, 70);
  assert.equal(spec.assessment.maxAttempts, 3);
  assert.equal(spec.assessment.shuffleQuestions, true);
  assert.equal(spec.assessment.shuffleOptions, true);
  assert.equal(spec.assessment.questions.length, 5);
  assert.equal(
    spec.assessment.questions.every(
      (question) =>
        question.learningObjectiveCodes.length > 0 &&
        question.learningObjectiveCodes.every((code) => objectiveCodes.has(code)) &&
        question.options.some((option) => option.isCorrect)
    ),
    true
  );
});
