import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAccreditationDossierPolishChecklist,
  buildStandardEvaluationQuestionTemplate,
  formatStandardEvaluationQuestionsForDossier,
} from "../../../src/lib/lms/accreditation-template.ts";

test("buildStandardEvaluationQuestionTemplate covers Kwaliteitshuis evaluation domains", () => {
  const questions = buildStandardEvaluationQuestionTemplate();

  assert.equal(questions.length, 7);
  assert.deepEqual(
    questions.map((question) => question.domain),
    [
      "niveau-diepgang",
      "praktijkrelevantie",
      "toepasbaarheid",
      "kwaliteit-leerstof",
      "toets-aansluiting",
      "studielast",
      "verbeterpunten",
    ],
  );
  assert.equal(questions[0].type, "SCALE_1_5");
  assert.equal(questions[5].type, "SCALE_1_5");
  assert.equal(questions[6].type, "TEXT");
  assert.ok(questions.every((question, index) => question.order === index + 1));
  assert.ok(questions.every((question) => question.isRequired));
});

test("formatStandardEvaluationQuestionsForDossier renders labels for accreditation handover", () => {
  const dossierText = formatStandardEvaluationQuestionsForDossier(buildStandardEvaluationQuestionTemplate());

  assert.match(dossierText, /1\. \[SCALE_1_5\] Niveau\/diepgang/);
  assert.match(dossierText, /praktijk/);
  assert.match(dossierText, /verbeterpunten/);
});

test("buildAccreditationDossierPolishChecklist shows final submit readiness", () => {
  const checklist = buildAccreditationDossierPolishChecklist({
    isPublishable: true,
    hasStandardEvaluationTemplate: true,
    hasEvidenceExport: true,
    hasParticipantReport: true,
    hasReviewerPreview: true,
    hasCertificateProofDownloads: true,
    hasChangeLog: true,
    hasRemainingCertificateEvidenceGaps: false,
  });

  assert.equal(checklist.isReadyToSubmit, true);
  assert.equal(checklist.openCriticalCount, 0);
  assert.match(checklist.summary, /inzendklaar/i);
});

test("buildAccreditationDossierPolishChecklist keeps source-data gaps explicit", () => {
  const checklist = buildAccreditationDossierPolishChecklist({
    isPublishable: true,
    hasStandardEvaluationTemplate: false,
    hasEvidenceExport: true,
    hasParticipantReport: true,
    hasReviewerPreview: true,
    hasCertificateProofDownloads: true,
    hasChangeLog: true,
    hasRemainingCertificateEvidenceGaps: true,
  });

  assert.equal(checklist.isReadyToSubmit, false);
  assert.ok(checklist.items.some((item) => item.id === "standard-evaluation-template" && item.status === "missing"));
  assert.ok(checklist.items.some((item) => item.id === "historical-evidence-gaps" && item.status === "warning"));
  assert.match(checklist.summary, /1 kritieke/i);
});
