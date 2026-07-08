import test from "node:test";
import assert from "node:assert/strict";

import {
  buildReviewerCoursePreviewSummary,
  canMutateLearnerProgress,
  getReviewerPreviewMode,
} from "../../../src/lib/lms/reviewer-preview.ts";

test("getReviewerPreviewMode marks reviewers and admins as non-mutating preview users", () => {
  assert.deepEqual(getReviewerPreviewMode("REVIEWER", false), {
    mode: "reviewer",
    isPreview: true,
    canViewWithoutEnrollment: true,
    canMutateProgress: false,
    label: "REVIEWER_PREVIEW",
  });

  assert.deepEqual(getReviewerPreviewMode("BEHEERDER", false), {
    mode: "beheer",
    isPreview: true,
    canViewWithoutEnrollment: true,
    canMutateProgress: false,
    label: "BEHEER_PREVIEW",
  });
});

test("getReviewerPreviewMode only allows learner mutation when there is a real enrollment", () => {
  assert.equal(canMutateLearnerProgress("REVIEWER", false), false);
  assert.equal(canMutateLearnerProgress("BEHEERDER", false), false);
  assert.equal(canMutateLearnerProgress("MEDEWERKER", false), false);
  assert.equal(canMutateLearnerProgress("MEDEWERKER", true), true);
  assert.equal(canMutateLearnerProgress("TEAMLEIDER", true), true);
});

test("buildReviewerCoursePreviewSummary exposes all courses without enrollment data", () => {
  const summary = buildReviewerCoursePreviewSummary([
    {
      id: "course-1",
      title: "Fy-Fit klinisch redeneren",
      status: "PUBLISHED",
      studyLoadMinutes: 120,
      accreditationRegister: "KRF NL",
      accreditationActivityId: "KH-2026-001",
      providerName: "Fy Fit Fysiotherapie Nijmegen",
      providerSignatureName: "Sjoerd Hendriks",
      requiredQuestionCount: 10,
      versionCount: 1,
      enrollmentCount: 8,
    },
    {
      id: "course-2",
      title: "Reviewer conceptcursus",
      status: "DRAFT",
      studyLoadMinutes: 60,
      accreditationRegister: null,
      accreditationActivityId: null,
      providerName: null,
      providerSignatureName: null,
      requiredQuestionCount: null,
      versionCount: 1,
      enrollmentCount: 0,
    },
  ]);

  assert.equal(summary.totalCourses, 2);
  assert.equal(summary.publishedCourses, 1);
  assert.equal(summary.draftCourses, 1);
  assert.equal(summary.totalStudyLoadMinutes, 180);
  assert.equal(summary.evidenceCompleteCourses, 1);
  assert.equal(summary.evidenceIncompleteCourses, 1);
  assert.equal(summary.items[0].previewPath, "/lms/courses/course-1");
  assert.equal(summary.items[0].displayAccreditationRegister, "KRF NL");
  assert.equal(summary.items[0].evidenceComplete, true);
  assert.equal(summary.items[0].canFreelyNavigate, true);
  assert.match(summary.items[0].reviewerChecklist.join("\n"), /Reviewflow module voor module beschikbaar/);
  assert.equal(summary.items[1].displayAccreditationRegister, "Niet vastgelegd");
  assert.equal(summary.items[1].evidenceComplete, false);
  assert.deepEqual(summary.items[1].evidenceMissingLabels, ["register", "activiteit-ID", "aanbieder", "ondertekenaar", "vraagminimum"]);
});
