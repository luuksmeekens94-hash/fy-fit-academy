import test from "node:test";
import assert from "node:assert/strict";

import {
  assertAccreditationPublishable,
  buildAccreditationEvidenceExport,
} from "../../../src/lib/lms/accreditation-evidence.ts";
import { buildAccreditationChecklist } from "../../../src/lib/lms/accreditation-checklist.ts";

const completeCourse = {
  id: "course-1",
  title: "Fy-Fit consultvoering basis",
  slug: "fy-fit-consultvoering-basis",
  description: "Basis e-learning voor consultvoering.",
  audience: "Fysiotherapeuten / collega's Fy-Fit",
  learningObjectives: null,
  goal: null,
  focus: null,
  learnerOutcomes: [],
  accreditationRegister: "Kwaliteitshuis Fysiotherapie",
  accreditationKind: "VAKINHOUDELIJK" as const,
  versionDate: new Date("2026-04-30T00:00:00.000Z"),
  authorExperts: [{ name: "Sjoerd", role: "Inhoudsdeskundige", organization: "Fy-Fit" }],
  requiredQuestionCount: 5,
  studyLoadMinutes: 120,
  status: "REVIEW" as const,
  isMandatory: true,
  authorId: "author-1",
  authorName: "Sjoerd",
  reviewerId: "reviewer-1",
  reviewerName: "Accreditatiecommissie Reviewer",
  publishedAt: null,
  revisionDueAt: null,
  createdAt: new Date("2026-04-01T00:00:00.000Z"),
  updatedAt: new Date("2026-04-30T00:00:00.000Z"),
  activeVersion: {
    id: "version-1",
    courseId: "course-1",
    versionNumber: "1.0",
    changeSummary: "Accreditatieversie ingericht.",
    isActive: true,
    createdAt: new Date("2026-04-30T00:00:00.000Z"),
    modules: [
      {
        id: "module-1",
        title: "Consultvoering",
        description: null,
        estimatedMinutes: 120,
        introduction: "Introductie",
        summary: "Samenvatting",
        order: 1,
        workForms: ["TEKST" as const, "CASUS" as const],
      },
    ],
    objectives: [
      { id: "lo-1", moduleId: "module-1", code: "LO1", text: "Na afloop kan de deelnemer uitleggen hoe consultvoering start.", order: 1 },
      { id: "lo-2", moduleId: "module-1", code: "LO2", text: "Na afloop kan de deelnemer klinisch redeneren bij intake.", order: 2 },
      { id: "lo-3", moduleId: "module-1", code: "LO3", text: "Na afloop kan de deelnemer afspraken concreet toepassen.", order: 3 },
    ],
    literature: [
      { id: "lit-1", moduleId: "module-1", title: "KNGF-richtlijn", guideline: "KNGF", source: "KNGF", url: null, year: 2024, order: 1 },
    ],
    competencies: [
      { id: "comp-1", moduleId: "module-1", name: "Communicator", framework: "CanMEDS", description: null },
    ],
    evaluationForms: [{ id: "eval-1", title: "Evaluatie", isRequired: true, questionCount: 7 }],
    changeLogs: [{ id: "log-1", changedAt: new Date("2026-04-30T00:00:00.000Z"), changeType: "PUBLISHED", summary: "Accreditatieversie ingericht.", changedByName: "Sjoerd" }],
    lessons: [{ id: "lesson-1", moduleId: "module-1", title: "Intro", slug: "intro", type: "TEXT" as const, estimatedMinutes: 20, isRequired: true, order: 1 }],
    assessments: [
      {
        id: "assessment-1",
        lessonId: null,
        title: "Eindtoets",
        passPercentage: 70,
        maxAttempts: 3,
        shuffleQuestions: true,
        shuffleOptions: true,
        questionCount: 5,
        allQuestionsLinkedToObjectives: true,
        isRequiredForCompletion: true,
      },
    ],
  },
};

test("buildAccreditationEvidenceExport renders a Kwaliteitshuis-ready markdown dossier", () => {
  const checklist = buildAccreditationChecklist({
    title: completeCourse.title,
    audience: completeCourse.audience,
    accreditationRegister: completeCourse.accreditationRegister,
    accreditationKind: completeCourse.accreditationKind,
    studyLoadMinutes: completeCourse.studyLoadMinutes,
    versionDate: completeCourse.versionDate,
    authorExperts: completeCourse.authorExperts,
    requiredQuestionCount: completeCourse.requiredQuestionCount,
    reviewerName: completeCourse.reviewerName,
    activeVersion: completeCourse.activeVersion,
    changeLogCount: completeCourse.activeVersion.changeLogs.length,
  });

  const dossier = buildAccreditationEvidenceExport(completeCourse, checklist);

  assert.match(dossier, /# Accreditatiedossier: Fy-Fit consultvoering basis/);
  assert.match(dossier, /Register: Kwaliteitshuis Fysiotherapie/);
  assert.match(dossier, /Leerdoelen/);
  assert.match(dossier, /LO2: Na afloop kan de deelnemer klinisch redeneren/);
  assert.match(dossier, /Toetsing/);
  assert.match(dossier, /70% norm/);
  assert.match(dossier, /max\. 3 pogingen/);
  assert.match(dossier, /Reviewer: Accreditatiecommissie Reviewer/);
  assert.match(dossier, /Wijzigingslog/);
});

test("assertAccreditationPublishable blocks courses with critical checklist gaps", () => {
  const checklist = buildAccreditationChecklist({
    title: completeCourse.title,
    audience: completeCourse.audience,
    accreditationRegister: null,
    accreditationKind: completeCourse.accreditationKind,
    studyLoadMinutes: completeCourse.studyLoadMinutes,
    versionDate: null,
    authorExperts: [],
    requiredQuestionCount: completeCourse.requiredQuestionCount,
    reviewerName: null,
    activeVersion: {
      ...completeCourse.activeVersion,
      objectives: completeCourse.activeVersion.objectives.slice(0, 2),
    },
    changeLogCount: 0,
  });

  assert.throws(
    () => assertAccreditationPublishable(checklist),
    /Niet publiceerbaar.*general-metadata.*learning-objectives.*reviewer-preview/s,
  );
});
