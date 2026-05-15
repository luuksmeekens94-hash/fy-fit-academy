import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAccreditationChecklist,
  getMinimumQuestionCountForAsyncElearning,
} from "../../../src/lib/lms/accreditation-checklist.ts";

const completeCourse = {
  title: "Fy-Fit consultvoering basis",
  audience: "Fysiotherapeuten / collega's Fy-Fit",
  accreditationRegister: "Kwaliteitshuis Fysiotherapie",
  accreditationKind: "VAKINHOUDELIJK" as const,
  accreditationActivityId: "KH-2026-DEMO",
  providerName: "Fy Fit Fysiotherapie Nijmegen",
  providerSignatureName: "Sjoerd Hendriks",
  studyLoadMinutes: 120,
  versionDate: new Date("2026-04-30"),
  authorExperts: [{ name: "Sjoerd", role: "Inhoudsdeskundige" }],
  requiredQuestionCount: 10,
  reviewerName: "Accreditatiecommissie Reviewer",
  activeVersion: {
    versionNumber: "1.0",
    modules: [
      {
        id: "module-1",
        title: "Consultvoering",
        estimatedMinutes: 120,
        introduction: "Introductie",
        summary: "Samenvatting",
        workForms: ["TEKST" as const, "CASUS" as const],
      },
    ],
    objectives: [
      { id: "lo-1", moduleId: "module-1", code: "LO1", text: "Na afloop kan de deelnemer uitleggen hoe consultvoering start." },
      { id: "lo-2", moduleId: "module-1", code: "LO2", text: "Na afloop kan de deelnemer klinisch redeneren bij intake." },
      { id: "lo-3", moduleId: "module-1", code: "LO3", text: "Na afloop kan de deelnemer afspraken concreet toepassen." },
    ],
    literature: [
      { id: "lit-1", moduleId: "module-1", title: "KNGF-richtlijn", guideline: "KNGF", source: "KNGF", url: null, year: 2024, order: 1 },
    ],
    competencies: [
      { id: "comp-1", moduleId: "module-1", name: "Communicator", framework: "CanMEDS", description: null },
    ],
    evaluationForms: [{ id: "eval-1", title: "Evaluatie", isRequired: true, questionCount: 7 }],
    assessments: [
      {
        id: "assessment-1",
        title: "Eindtoets",
        passPercentage: 70,
        maxAttempts: 3,
        shuffleQuestions: true,
        shuffleOptions: true,
        questionCount: 10,
        allQuestionsLinkedToObjectives: true,
        coveredObjectiveIds: ["lo-1", "lo-2", "lo-3"],
      },
    ],
    lessons: [{ id: "lesson-1", moduleId: "module-1", title: "Intro", estimatedMinutes: 20, isRequired: true, content: "Geen commerciële links." }],
  },
  changeLogCount: 1,
};

test("buildAccreditationChecklist marks a complete course as publishable", () => {
  const result = buildAccreditationChecklist(completeCourse);

  assert.equal(result.isPublishable, true);
  assert.equal(result.criticalOpenCount, 0);
  assert.ok(result.items.every((item) => item.status === "complete" || item.severity === "warning"));
});

test("buildAccreditationChecklist blocks publishing when critical accreditation metadata is missing", () => {
  const result = buildAccreditationChecklist({
    ...completeCourse,
    accreditationRegister: null,
    versionDate: null,
    activeVersion: {
      ...completeCourse.activeVersion,
      objectives: completeCourse.activeVersion.objectives.slice(0, 2),
      modules: [],
    },
  });

  assert.equal(result.isPublishable, false);
  assert.ok(result.criticalOpenCount >= 3);
  assert.ok(result.items.some((item) => item.id === "general-metadata" && item.status === "missing"));
  assert.ok(result.items.some((item) => item.id === "learning-objectives" && item.status === "missing"));
  assert.ok(result.items.some((item) => item.id === "modules" && item.status === "missing"));
});

test("buildAccreditationChecklist warns when module minutes differ from total study load", () => {
  const result = buildAccreditationChecklist({
    ...completeCourse,
    studyLoadMinutes: 240,
    activeVersion: {
      ...completeCourse.activeVersion,
      assessments: completeCourse.activeVersion.assessments.map((assessment) => ({
        ...assessment,
        questionCount: 15,
      })),
    },
  });

  assert.equal(result.isPublishable, true);
  assert.ok(result.items.some((item) => item.id === "study-load-balance" && item.status === "warning"));
});

test("getMinimumQuestionCountForAsyncElearning derives Kwaliteitshuis question counts from duration", () => {
  assert.equal(getMinimumQuestionCountForAsyncElearning(29), 1);
  assert.equal(getMinimumQuestionCountForAsyncElearning(30), 5);
  assert.equal(getMinimumQuestionCountForAsyncElearning(60), 5);
  assert.equal(getMinimumQuestionCountForAsyncElearning(61), 10);
  assert.equal(getMinimumQuestionCountForAsyncElearning(120), 10);
  assert.equal(getMinimumQuestionCountForAsyncElearning(121), 15);
  assert.equal(getMinimumQuestionCountForAsyncElearning(180), 15);
});

test("buildAccreditationChecklist accepts stricter pass norms of at least 70 percent", () => {
  const result = buildAccreditationChecklist({
    ...completeCourse,
    activeVersion: {
      ...completeCourse.activeVersion,
      assessments: completeCourse.activeVersion.assessments.map((assessment) => ({
        ...assessment,
        passPercentage: 80,
      })),
    },
  });

  assert.equal(result.isPublishable, true);
  assert.equal(result.items.find((item) => item.id === "assessment-rules")?.status, "complete");
});

test("buildAccreditationChecklist blocks duration-based question count gaps", () => {
  const result = buildAccreditationChecklist({
    ...completeCourse,
    studyLoadMinutes: 110,
    activeVersion: {
      ...completeCourse.activeVersion,
      modules: completeCourse.activeVersion.modules.map((module) => ({ ...module, estimatedMinutes: 110 })),
      assessments: completeCourse.activeVersion.assessments.map((assessment) => ({
        ...assessment,
        questionCount: 5,
      })),
    },
  });

  assert.equal(result.isPublishable, false);
  assert.equal(result.items.find((item) => item.id === "assessment-question-count")?.status, "missing");
});

test("buildAccreditationChecklist blocks more than 6 modules and modules longer than 180 minutes", () => {
  const modules = Array.from({ length: 7 }, (_, index) => ({
    ...completeCourse.activeVersion.modules[0],
    id: `module-${index + 1}`,
    title: `Module ${index + 1}`,
    estimatedMinutes: index === 0 ? 181 : 10,
  }));
  const objectives = modules.map((module, index) => ({
    id: `lo-${index + 1}`,
    moduleId: module.id,
    code: `LO${index + 1}`,
    text: `Na afloop kan de deelnemer onderdeel ${index + 1} toepassen.`,
  }));

  const result = buildAccreditationChecklist({
    ...completeCourse,
    activeVersion: {
      ...completeCourse.activeVersion,
      modules,
      objectives,
      lessons: modules.map((module, index) => ({
        id: `lesson-${index + 1}`,
        moduleId: module.id,
        title: `Les ${index + 1}`,
        estimatedMinutes: 10,
        isRequired: true,
        content: "Geen commerciële links.",
      })),
    },
  });

  assert.equal(result.isPublishable, false);
  assert.equal(result.items.find((item) => item.id === "module-count")?.status, "missing");
  assert.equal(result.items.find((item) => item.id === "module-duration")?.status, "missing");
});

test("buildAccreditationChecklist blocks assessments without question and answer randomization", () => {
  const result = buildAccreditationChecklist({
    ...completeCourse,
    activeVersion: {
      ...completeCourse.activeVersion,
      assessments: completeCourse.activeVersion.assessments.map((assessment) => ({
        ...assessment,
        shuffleQuestions: false,
        shuffleOptions: false,
      })),
    },
  });

  assert.equal(result.isPublishable, false);
  assert.equal(result.items.find((item) => item.id === "assessment-randomization")?.status, "missing");
});

test("buildAccreditationChecklist blocks lessons with commercial hyperlinks", () => {
  const result = buildAccreditationChecklist({
    ...completeCourse,
    activeVersion: {
      ...completeCourse.activeVersion,
      lessons: completeCourse.activeVersion.lessons.map((lesson) => ({
        ...lesson,
        content: "Bekijk onze aanbieding op https://shop.example.com/fysio-product en koop vandaag nog.",
      })),
    },
  });

  assert.equal(result.isPublishable, false);
  assert.equal(result.items.find((item) => item.id === "commercial-links")?.status, "missing");
});

test("buildAccreditationChecklist blocks uncovered learning objectives in the assessment blueprint", () => {
  const result = buildAccreditationChecklist({
    ...completeCourse,
    activeVersion: {
      ...completeCourse.activeVersion,
      assessments: completeCourse.activeVersion.assessments.map((assessment) => ({
        ...assessment,
        coveredObjectiveIds: ["lo-1", "lo-2"],
      })),
    },
  });

  assert.equal(result.isPublishable, false);
  assert.equal(result.items.find((item) => item.id === "assessment-objective-coverage")?.status, "missing");
});
