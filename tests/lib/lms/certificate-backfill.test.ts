import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeCertificateBackfill,
  buildCertificateEvidenceAudit,
} from "../../../src/lib/lms/certificate-backfill.ts";

const completeCertificate = {
  id: "cert-complete",
  participantName: "Lotte Jansen",
  registrationNumber: "KRF-12345",
  courseTitle: "Fy-Fit consultvoering",
  completedAt: new Date("2026-05-01T08:00:00.000Z"),
  attemptCount: 2,
  evaluationCompleted: true,
  courseVersionNumber: "1.0",
  accreditationRegisterSnapshot: "KRF NL",
  accreditationKindSnapshot: "VAKINHOUDELIJK" as const,
};

test("analyzeCertificateBackfill marks complete snapshot as ready", () => {
  const result = analyzeCertificateBackfill(completeCertificate);

  assert.equal(result.isComplete, true);
  assert.equal(result.missingFields.length, 0);
  assert.equal(result.canBackfill, false);
});

test("analyzeCertificateBackfill finds missing proof snapshot fields and backfillable records", () => {
  const result = analyzeCertificateBackfill({
    ...completeCertificate,
    id: "cert-missing",
    participantName: null,
    registrationNumber: null,
    courseTitle: null,
    completedAt: null,
    attemptCount: null,
    courseVersionNumber: null,
    accreditationRegisterSnapshot: null,
    accreditationKindSnapshot: null,
  });

  assert.equal(result.isComplete, false);
  assert.equal(result.canBackfill, true);
  assert.deepEqual(result.missingFields, [
    "participantName",
    "registrationNumber",
    "courseTitle",
    "completedAt",
    "attemptCount",
    "courseVersionNumber",
    "accreditationRegisterSnapshot",
    "accreditationKindSnapshot",
  ]);
});

test("buildCertificateEvidenceAudit summarizes certificate evidence quality", () => {
  const audit = buildCertificateEvidenceAudit([
    completeCertificate,
    {
      ...completeCertificate,
      id: "cert-partial",
      registrationNumber: null,
      completedAt: null,
    },
  ]);

  assert.equal(audit.totalCertificates, 2);
  assert.equal(audit.completeSnapshots, 1);
  assert.equal(audit.incompleteSnapshots, 1);
  assert.equal(audit.backfillableSnapshots, 1);
  assert.equal(audit.missingRegistrationNumbers, 1);
  assert.equal(audit.items[1].downloadPath, "/lms/certificates/cert-partial/download");
  assert.deepEqual(audit.items[1].missingFields, ["registrationNumber", "completedAt"]);
});
