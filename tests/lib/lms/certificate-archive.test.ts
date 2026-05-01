import test from "node:test";
import assert from "node:assert/strict";

import { buildCertificateArchiveSummary } from "../../../src/lib/lms/certificate-archive.ts";

const certificates = [
  {
    id: "cert-1",
    courseId: "course-1",
    courseTitle: "Fy-Fit consultvoering",
    participantName: "Lotte Jansen",
    registrationNumber: "KRF-12345",
    completedAt: new Date("2026-04-30T10:00:00.000Z"),
    issuedAt: new Date("2026-05-01T08:00:00.000Z"),
    scorePercentage: 86,
    studyLoadMinutes: 120,
    attemptCount: 2,
    evaluationCompleted: true,
    certificateCode: "CERT-1",
    versionNumber: "1.0",
    accreditationRegister: "KRF NL",
  },
  {
    id: "cert-2",
    courseId: "course-2",
    courseTitle: "Fy-Fit leiderschap",
    participantName: null,
    registrationNumber: null,
    completedAt: null,
    issuedAt: new Date("2026-04-01T08:00:00.000Z"),
    scorePercentage: null,
    studyLoadMinutes: 90,
    attemptCount: null,
    evaluationCompleted: false,
    certificateCode: "CERT-2",
    versionNumber: "2.1",
    accreditationRegister: null,
  },
];

test("buildCertificateArchiveSummary counts certificates and total study load", () => {
  const summary = buildCertificateArchiveSummary(certificates);

  assert.equal(summary.totalCertificates, 2);
  assert.equal(summary.totalStudyLoadMinutes, 210);
  assert.equal(summary.completedEvaluations, 1);
  assert.equal(summary.missingRegistrationNumbers, 1);
});

test("buildCertificateArchiveSummary exposes download path per certificate", () => {
  const summary = buildCertificateArchiveSummary(certificates);

  assert.equal(summary.items[0].downloadPath, "/lms/certificates/cert-1/download");
  assert.equal(summary.items[0].displayRegistrationNumber, "KRF-12345");
  assert.equal(summary.items[1].displayRegistrationNumber, "Niet vastgelegd");
});
