import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCertificateEvidence,
  buildCertificateDownload,
} from "../../../src/lib/lms/certificate-evidence.ts";

const input = {
  certificateId: "cert-1",
  userId: "user-1",
  courseId: "course-1",
  certificateCode: "CERT-2026-001",
  participantName: "Lotte Jansen",
  professionalRegistrationNumber: "krf - 12345",
  courseTitle: "Fy-Fit consultvoering basis",
  completedAt: new Date("2026-04-30T10:00:00.000Z"),
  issuedAt: new Date("2026-04-30T10:05:00.000Z"),
  scorePercentage: 82.5,
  attemptCount: 2,
  evaluationCompleted: true,
  studyLoadMinutes: 180,
  versionNumber: "1.0",
  accreditationRegister: "KRF NL",
  accreditationKind: "VAKINHOUDELIJK" as const,
};

test("buildCertificateEvidence normalizes certificate proof fields for accreditation", () => {
  const evidence = buildCertificateEvidence(input);

  assert.equal(evidence.participantName, "Lotte Jansen");
  assert.equal(evidence.professionalRegistrationNumber, "KRF-12345");
  assert.equal(evidence.courseTitle, "Fy-Fit consultvoering basis");
  assert.equal(evidence.completedAt, "2026-04-30");
  assert.equal(evidence.scorePercentage, "82.5%");
  assert.equal(evidence.attemptCount, "2");
  assert.equal(evidence.evaluationCompleted, "ja");
  assert.equal(evidence.studyLoad, "3 uur");
  assert.equal(evidence.versionNumber, "1.0");
  assert.equal(evidence.status, "behaald");
});

test("buildCertificateEvidence keeps missing fields explicit instead of inventing data", () => {
  const evidence = buildCertificateEvidence({
    ...input,
    professionalRegistrationNumber: null,
    completedAt: null,
    scorePercentage: null,
    attemptCount: 0,
    evaluationCompleted: false,
    studyLoadMinutes: null,
    accreditationRegister: null,
  });

  assert.equal(evidence.professionalRegistrationNumber, "Niet vastgelegd");
  assert.equal(evidence.completedAt, "Niet vastgelegd");
  assert.equal(evidence.scorePercentage, "Niet beschikbaar");
  assert.equal(evidence.attemptCount, "Niet beschikbaar");
  assert.equal(evidence.evaluationCompleted, "nee");
  assert.equal(evidence.studyLoad, "Niet vastgelegd");
  assert.equal(evidence.accreditationRegister, "Niet vastgelegd");
});

test("buildCertificateDownload renders a print-ready HTML certificate download", () => {
  const download = buildCertificateDownload(input);

  assert.equal(download.filename, "certificaat-fy-fit-consultvoering-basis-cert-2026-001.html");
  assert.equal(download.contentType, "text/html; charset=utf-8");
  assert.match(download.body, /<!doctype html>/i);
  assert.match(download.body, /Certificaat\/deelnamebewijs/);
  assert.match(download.body, /Lotte Jansen/);
  assert.match(download.body, /KRF-12345/);
  assert.match(download.body, /window\.print\(\)/);
  assert.match(download.body, /@media print/);
});
