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

export type CertificateArchiveSummaryOptions = {
  downloadBasePath?: "/lms/certificates" | "/academy/certificates";
};

export function buildCertificateArchiveSummary(
  certificates: CertificateSummary[],
  options: CertificateArchiveSummaryOptions = {},
): CertificateArchiveSummary {
  const downloadBasePath = options.downloadBasePath ?? "/lms/certificates";
  const items = certificates.map((certificate) => ({
    ...certificate,
    downloadPath: `${downloadBasePath}/${certificate.id}/download`,
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
