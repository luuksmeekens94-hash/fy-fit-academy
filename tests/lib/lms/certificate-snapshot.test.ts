import test from "node:test";
import assert from "node:assert/strict";

import { buildCertificateSnapshot } from "../../../src/lib/lms/certificate-snapshot.ts";

test("buildCertificateSnapshot persists immutable accreditation proof fields", () => {
  const snapshot = buildCertificateSnapshot({
    participantName: "Lotte Jansen",
    professionalRegistrationNumber: " krf / 12345 ",
    courseTitle: "Fy-Fit consultvoering basis",
    completedAt: new Date("2026-05-01T08:30:00.000Z"),
    attemptCount: 2,
    evaluationCompleted: true,
    versionNumber: "1.0",
    accreditationRegister: "KRF NL",
    accreditationKind: "VAKINHOUDELIJK",
  });

  assert.equal(snapshot.participantName, "Lotte Jansen");
  assert.equal(snapshot.registrationNumber, "KRF-12345");
  assert.equal(snapshot.courseTitle, "Fy-Fit consultvoering basis");
  assert.equal(snapshot.completedAt?.toISOString(), "2026-05-01T08:30:00.000Z");
  assert.equal(snapshot.attemptCount, 2);
  assert.equal(snapshot.evaluationCompleted, true);
  assert.equal(snapshot.courseVersionNumber, "1.0");
  assert.equal(snapshot.accreditationRegisterSnapshot, "KRF NL");
  assert.equal(snapshot.accreditationKindSnapshot, "VAKINHOUDELIJK");
});

test("buildCertificateSnapshot keeps missing optional proof fields explicit", () => {
  const snapshot = buildCertificateSnapshot({
    participantName: "Sjoerd",
    professionalRegistrationNumber: null,
    courseTitle: "Fy-Fit leiderschap",
    completedAt: null,
    attemptCount: 0,
    evaluationCompleted: false,
    versionNumber: "2.1",
    accreditationRegister: null,
    accreditationKind: "BEROEPSGERELATEERD",
  });

  assert.equal(snapshot.registrationNumber, null);
  assert.equal(snapshot.completedAt, null);
  assert.equal(snapshot.attemptCount, 0);
  assert.equal(snapshot.evaluationCompleted, false);
  assert.equal(snapshot.accreditationRegisterSnapshot, null);
});
