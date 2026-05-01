import type { CertificateSummary } from "./types";

export type CertificateArchiveItem = CertificateSummary & {
  downloadPath: string;
  displayRegistrationNumber: string;
};

export type CertificateArchiveSummary = {
  totalCertificates: number;
  totalStudyLoadMinutes: number;
  completedEvaluations: number;
  missingRegistrationNumbers: number;
  items: CertificateArchiveItem[];
};

export function buildCertificateArchiveSummary(
  certificates: CertificateSummary[]
): CertificateArchiveSummary {
  const items = certificates.map((certificate) => ({
    ...certificate,
    downloadPath: `/lms/certificates/${certificate.id}/download`,
    displayRegistrationNumber: certificate.registrationNumber ?? "Niet vastgelegd",
  }));

  return {
    totalCertificates: certificates.length,
    totalStudyLoadMinutes: certificates.reduce(
      (total, certificate) => total + (certificate.studyLoadMinutes ?? 0),
      0
    ),
    completedEvaluations: certificates.filter((certificate) => certificate.evaluationCompleted).length,
    missingRegistrationNumbers: certificates.filter((certificate) => !certificate.registrationNumber).length,
    items,
  };
}
