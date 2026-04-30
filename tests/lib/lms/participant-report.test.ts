import test from "node:test";
import assert from "node:assert/strict";

import {
  buildParticipantCompletionReport,
  exportParticipantCompletionReportCsv,
  exportParticipantCompletionReportMarkdown,
} from "../../../src/lib/lms/participant-report.ts";

const input = {
  courseTitle: "Fy-Fit consultvoering basis",
  participantName: "Lotte Jansen",
  professionalRegistrationNumber: "KRF-12345",
  completedAt: new Date("2026-04-30T10:00:00.000Z"),
  enrollmentStatus: "COMPLETED" as const,
  assessmentAttempts: [
    { assessmentTitle: "Eindtoets", attemptNumber: 1, scorePercentage: 60, passed: false, submittedAt: new Date("2026-04-29T10:00:00.000Z") },
    { assessmentTitle: "Eindtoets", attemptNumber: 2, scorePercentage: 80, passed: true, submittedAt: new Date("2026-04-30T10:00:00.000Z") },
  ],
  certificate: {
    id: "cert-1",
    certificateCode: "CERT-2026-001",
    issuedAt: new Date("2026-04-30T10:05:00.000Z"),
  },
  evaluationCompleted: true,
};

test("buildParticipantCompletionReport summarizes required accreditation evidence per participant", () => {
  const report = buildParticipantCompletionReport(input);

  assert.equal(report.participantName, "Lotte Jansen");
  assert.equal(report.professionalRegistrationNumber, "KRF-12345");
  assert.equal(report.courseTitle, "Fy-Fit consultvoering basis");
  assert.equal(report.completedAt, "2026-04-30");
  assert.equal(report.bestScorePercentage, 80);
  assert.equal(report.attemptCount, 2);
  assert.equal(report.passed, true);
  assert.equal(report.certificateAvailable, true);
  assert.equal(report.certificateCode, "CERT-2026-001");
  assert.equal(report.evaluationCompleted, true);
});

test("buildParticipantCompletionReport handles missing certificate, registration and evaluation", () => {
  const report = buildParticipantCompletionReport({
    ...input,
    professionalRegistrationNumber: null,
    completedAt: null,
    enrollmentStatus: "IN_PROGRESS",
    assessmentAttempts: [],
    certificate: null,
    evaluationCompleted: false,
  });

  assert.equal(report.professionalRegistrationNumber, "Niet vastgelegd");
  assert.equal(report.completedAt, "Niet afgerond");
  assert.equal(report.bestScorePercentage, null);
  assert.equal(report.attemptCount, 0);
  assert.equal(report.passed, false);
  assert.equal(report.certificateAvailable, false);
  assert.equal(report.evaluationCompleted, false);
});

test("participant report exports markdown and csv for accreditation/audit delivery", () => {
  const report = buildParticipantCompletionReport(input);
  const markdown = exportParticipantCompletionReportMarkdown([report]);
  const csv = exportParticipantCompletionReportCsv([report]);

  assert.match(markdown, /# Deelnemerrapportage LMS/);
  assert.match(markdown, /Lotte Jansen/);
  assert.match(markdown, /Evaluatie ingevuld: ja/);
  assert.match(csv, /participantName,professionalRegistrationNumber,courseTitle,completedAt,bestScorePercentage,attemptCount,passed,certificateAvailable,certificateCode,evaluationCompleted/);
  assert.match(csv, /Lotte Jansen,KRF-12345,Fy-Fit consultvoering basis,2026-04-30,80,2,ja,ja,CERT-2026-001,ja/);
});
