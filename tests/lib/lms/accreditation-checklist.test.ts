import test from "node:test";
import assert from "node:assert/strict";

import { buildAccreditationChecklist } from "../../../src/lib/lms/accreditation-checklist.ts";

const completeCourse = {
  title: "Fy-Fit consultvoering basis",
  audience: "Fysiotherapeuten / collega's Fy-Fit",
  accreditationRegister: "Kwaliteitshuis Fysiotherapie",
  accreditationKind: "VAKINHOUDELIJK" as const,
  studyLoadMinutes: 120,
  versionDate: new Date("2026-04-30"),
  authorExperts: [{ name: "Sjoerd", role: "Inhoudsdeskundige" }],
  requiredQuestionCount: 5,
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
        shuffleOptions: true,
        questionCount: 5,
        allQuestionsLinkedToObjectives: true,
      },
    ],
    lessons: [{ id: "lesson-1", moduleId: "module-1", title: "Intro", estimatedMinutes: 20, isRequired: true }],
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
  });

  assert.equal(result.isPublishable, true);
  assert.ok(result.items.some((item) => item.id === "study-load-balance" && item.status === "warning"));
});
