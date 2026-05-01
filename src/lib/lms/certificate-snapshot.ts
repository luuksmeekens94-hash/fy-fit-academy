import type { AccreditationKind } from "@prisma/client";

export type CertificateSnapshotInput = {
  participantName: string;
  professionalRegistrationNumber: string | null;
  courseTitle: string;
  completedAt: Date | null;
  attemptCount: number;
  evaluationCompleted: boolean;
  versionNumber: string;
  accreditationRegister: string | null;
  accreditationKind: AccreditationKind;
};

export type CertificateSnapshot = {
  participantName: string;
  registrationNumber: string | null;
  courseTitle: string;
  completedAt: Date | null;
  attemptCount: number;
  evaluationCompleted: boolean;
  courseVersionNumber: string;
  accreditationRegisterSnapshot: string | null;
  accreditationKindSnapshot: AccreditationKind;
};

export function normalizeCertificateRegistrationNumber(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed
    .toUpperCase()
    .replace(/[\s/]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^([A-Z]+)-?(\d.*)$/, "$1-$2")
    .replace(/^-+|-+$/g, "");
}

export function buildCertificateSnapshot(input: CertificateSnapshotInput): CertificateSnapshot {
  return {
    participantName: input.participantName.trim() || "Onbekende deelnemer",
    registrationNumber: normalizeCertificateRegistrationNumber(input.professionalRegistrationNumber),
    courseTitle: input.courseTitle.trim() || "Onbekende e-learning",
    completedAt: input.completedAt,
    attemptCount: Math.max(0, input.attemptCount),
    evaluationCompleted: input.evaluationCompleted,
    courseVersionNumber: input.versionNumber.trim() || "Onbekend",
    accreditationRegisterSnapshot: input.accreditationRegister?.trim() || null,
    accreditationKindSnapshot: input.accreditationKind,
  };
}
