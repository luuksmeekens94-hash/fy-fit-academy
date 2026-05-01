import type { AccreditationKind } from "@prisma/client";

export type CertificateBackfillField =
  | "participantName"
  | "registrationNumber"
  | "courseTitle"
  | "completedAt"
  | "attemptCount"
  | "courseVersionNumber"
  | "accreditationRegisterSnapshot"
  | "accreditationKindSnapshot";

export type CertificateBackfillCandidate = {
  id: string;
  participantName: string | null;
  registrationNumber: string | null;
  courseTitle: string | null;
  completedAt: Date | null;
  attemptCount: number | null;
  evaluationCompleted: boolean;
  courseVersionNumber: string | null;
  accreditationRegisterSnapshot: string | null;
  accreditationKindSnapshot: AccreditationKind | null;
};

export type CertificateBackfillAnalysis = {
  certificateId: string;
  isComplete: boolean;
  canBackfill: boolean;
  missingFields: CertificateBackfillField[];
  downloadPath: string;
};

export type CertificateEvidenceAudit = {
  totalCertificates: number;
  completeSnapshots: number;
  incompleteSnapshots: number;
  backfillableSnapshots: number;
  missingRegistrationNumbers: number;
  items: CertificateBackfillAnalysis[];
};

const requiredSnapshotFields: Array<{
  field: CertificateBackfillField;
  isMissing: (certificate: CertificateBackfillCandidate) => boolean;
}> = [
  { field: "participantName", isMissing: (certificate) => !certificate.participantName?.trim() },
  { field: "registrationNumber", isMissing: (certificate) => !certificate.registrationNumber?.trim() },
  { field: "courseTitle", isMissing: (certificate) => !certificate.courseTitle?.trim() },
  { field: "completedAt", isMissing: (certificate) => certificate.completedAt === null },
  { field: "attemptCount", isMissing: (certificate) => certificate.attemptCount === null },
  { field: "courseVersionNumber", isMissing: (certificate) => !certificate.courseVersionNumber?.trim() },
  {
    field: "accreditationRegisterSnapshot",
    isMissing: (certificate) => !certificate.accreditationRegisterSnapshot?.trim(),
  },
  {
    field: "accreditationKindSnapshot",
    isMissing: (certificate) => certificate.accreditationKindSnapshot === null,
  },
];

export function analyzeCertificateBackfill(
  certificate: CertificateBackfillCandidate
): CertificateBackfillAnalysis {
  const missingFields = requiredSnapshotFields
    .filter((entry) => entry.isMissing(certificate))
    .map((entry) => entry.field);

  return {
    certificateId: certificate.id,
    isComplete: missingFields.length === 0,
    canBackfill: missingFields.length > 0,
    missingFields,
    downloadPath: `/lms/certificates/${certificate.id}/download`,
  };
}

export function buildCertificateEvidenceAudit(
  certificates: CertificateBackfillCandidate[]
): CertificateEvidenceAudit {
  const items = certificates.map(analyzeCertificateBackfill);

  return {
    totalCertificates: certificates.length,
    completeSnapshots: items.filter((item) => item.isComplete).length,
    incompleteSnapshots: items.filter((item) => !item.isComplete).length,
    backfillableSnapshots: items.filter((item) => item.canBackfill).length,
    missingRegistrationNumbers: certificates.filter((certificate) => !certificate.registrationNumber?.trim())
      .length,
    items,
  };
}
