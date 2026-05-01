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
  assert.equal(spec.version.versionNumber, "demo-12C.1");
  assert.equal(spec.modules.length, 3);
  assert.equal(spec.course.studyLoadMinutes, 210);
  assert.equal(spec.course.requiredQuestionCount, 10);
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

test("demo seed includes Sprint 12B module 2 with BPS system lessons, images and objectives", () => {
  const spec = buildDemoElearningSeedSpec();
  const module2 = spec.modules.find((module) => module.key === "module-2-bps-dynamisch-systeem");

  assert.ok(module2);
  assert.equal(module2.title, "Module 2: Het biopsychosociaal model als dynamisch systeem");
  assert.equal(module2.order, 2);
  assert.equal(module2.workForms.includes("TEKST"), true);
  assert.equal(module2.workForms.includes("CASUS"), true);
  assert.equal(module2.workForms.includes("REFLECTIE"), true);
  assert.equal(module2.workForms.includes("TOETS"), true);

  assert.equal(spec.learningObjectives.filter((objective) => objective.moduleKey === module2.key).length, 6);
  assert.equal(spec.lessons.filter((lesson) => module2.lessonSlugs.includes(lesson.slug)).length, module2.lessonSlugs.length);

  assert.deepEqual(module2.assetPaths, [
    `${DEMO_ELEARNING_ASSET_ROOT}/module-2/images/image1.png`,
    `${DEMO_ELEARNING_ASSET_ROOT}/module-2/images/image2.png`,
  ]);

  const networkLesson = spec.lessons.find((lesson) => lesson.slug === "module-2-bps-dynamisch-netwerk");
  assert.ok(networkLesson);
  assert.match(networkLesson.content, /biopsychosociaal model als dynamisch netwerk/i);
  assert.match(networkLesson.content, /module-2\/images\/image1\.png/);
});

test("demo seed includes Sprint 12C module 3 with summary, reflection and evaluation close-out", () => {
  const spec = buildDemoElearningSeedSpec();
  const module3 = spec.modules.find((module) => module.key === "module-3-samenvatting-afsluiting");

  assert.ok(module3);
  assert.equal(module3.title, "Module 3: Samenvatting en afsluiting");
  assert.equal(module3.order, 3);
  assert.equal(module3.workForms.includes("TEKST"), true);
  assert.equal(module3.workForms.includes("REFLECTIE"), true);
  assert.equal(module3.workForms.includes("TOETS"), false);
  assert.equal(spec.lessons.filter((lesson) => module3.lessonSlugs.includes(lesson.slug)).length, module3.lessonSlugs.length);

  const reflectionLesson = spec.lessons.find((lesson) => lesson.slug === "module-3-reflectie-praktijktransfer");
  assert.ok(reflectionLesson);
  assert.match(reflectionLesson.content, /grillig verliep/i);
  assert.match(reflectionLesson.content, /dagelijkse praktijk/i);
});

test("demo has a separate assessment after each inhoudelijke module", () => {
  const spec = buildDemoElearningSeedSpec();
  const objectiveCodes = new Set(spec.learningObjectives.map((objective) => objective.code));

  assert.equal(spec.assessments.length, 2);
  assert.deepEqual(
    spec.assessments.map((assessment) => assessment.lessonSlug),
    ["module-1-toets-complexiteit", "module-2-toets-bps-dynamisch-systeem"]
  );

  for (const assessment of spec.assessments) {
    assert.equal(assessment.passPercentage, 70);
    assert.equal(assessment.maxAttempts, 3);
    assert.equal(assessment.shuffleQuestions, true);
    assert.equal(assessment.shuffleOptions, true);
    assert.equal(assessment.questions.length, 5);
    assert.equal(
      assessment.questions.every(
        (question) =>
          question.learningObjectiveCodes.length > 0 &&
          question.learningObjectiveCodes.every((code) => objectiveCodes.has(code)) &&
          question.options.some((option) => option.isCorrect)
      ),
      true
    );
  }
});
