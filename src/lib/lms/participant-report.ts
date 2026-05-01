export type ParticipantReportInput = {
  courseTitle: string;
  participantName: string;
  professionalRegistrationNumber: string | null;
  completedAt: Date | null;
  enrollmentStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "EXPIRED";
  assessmentAttempts: {
    assessmentTitle: string;
    attemptNumber: number;
    scorePercentage: number | null;
    passed: boolean | null;
    submittedAt: Date | null;
  }[];
  certificate: {
    id: string;
    certificateCode: string;
    issuedAt: Date;
  } | null;
  evaluationCompleted: boolean;
};

export type ParticipantCompletionReport = {
  participantName: string;
  professionalRegistrationNumber: string;
  courseTitle: string;
  completedAt: string;
  bestScorePercentage: number | null;
  attemptCount: number;
  passed: boolean;
  enrollmentStatus: ParticipantReportInput["enrollmentStatus"];
  certificateAvailable: boolean;
  certificateCode: string;
  certificateId: string | null;
  certificateProofPath: string;
  evaluationCompleted: boolean;
};

function formatDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "Niet afgerond";
}

function yesNo(value: boolean) {
  return value ? "ja" : "nee";
}

function csvEscape(value: string | number | null) {
  const text = value === null ? "" : String(value);
  if (!/[",\n]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "cursus";
}

export function normalizeProfessionalRegistrationNumber(value: string | null | undefined) {
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

export function buildParticipantCompletionReport(input: ParticipantReportInput): ParticipantCompletionReport {
  const submittedAttempts = input.assessmentAttempts.filter((attempt) => attempt.submittedAt !== null);
  const scoredAttempts = submittedAttempts.filter((attempt) => attempt.scorePercentage !== null);
  const bestScorePercentage = scoredAttempts.length
    ? Math.max(...scoredAttempts.map((attempt) => attempt.scorePercentage ?? 0))
    : null;

  return {
    participantName: input.participantName,
    professionalRegistrationNumber: input.professionalRegistrationNumber?.trim() || "Niet vastgelegd",
    courseTitle: input.courseTitle,
    completedAt: formatDate(input.completedAt),
    bestScorePercentage,
    attemptCount: submittedAttempts.length,
    passed: input.enrollmentStatus === "COMPLETED" || submittedAttempts.some((attempt) => attempt.passed === true),
    enrollmentStatus: input.enrollmentStatus,
    certificateAvailable: input.certificate !== null,
    certificateCode: input.certificate?.certificateCode ?? "Niet beschikbaar",
    certificateId: input.certificate?.id ?? null,
    certificateProofPath: input.certificate ? `/lms/certificates/${input.certificate.id}/download` : "Niet beschikbaar",
    evaluationCompleted: input.evaluationCompleted,
  };
}

export function exportParticipantCompletionReportMarkdown(rows: ParticipantCompletionReport[]) {
  const lines = ["# Deelnemerrapportage LMS", ""];

  if (!rows.length) {
    lines.push("Geen deelnemers gevonden.");
    return lines.join("\n");
  }

  for (const row of rows) {
    lines.push(`## ${row.participantName}`);
    lines.push(`- Registratienummer: ${row.professionalRegistrationNumber}`);
    lines.push(`- E-learning titel: ${row.courseTitle}`);
    lines.push(`- Datum afronding: ${row.completedAt}`);
    lines.push(`- Score toets: ${row.bestScorePercentage === null ? "Niet beschikbaar" : `${row.bestScorePercentage}%`}`);
    lines.push(`- Aantal pogingen: ${row.attemptCount}`);
    lines.push(`- Behaalde status: ${row.passed ? "behaald" : row.enrollmentStatus}`);
    lines.push(`- Certificaat/deelnamebewijs: ${row.certificateAvailable ? row.certificateCode : "nee"}`);
    lines.push(`- Bewijsdownload: ${row.certificateAvailable ? row.certificateProofPath : "Niet beschikbaar"}`);
    lines.push(`- Evaluatie ingevuld: ${yesNo(row.evaluationCompleted)}`);
    lines.push("");
  }

  return lines.join("\n");
}

export function exportParticipantCompletionReportCsv(rows: ParticipantCompletionReport[]) {
  const headers = [
    "participantName",
    "professionalRegistrationNumber",
    "courseTitle",
    "completedAt",
    "bestScorePercentage",
    "attemptCount",
    "passed",
    "certificateAvailable",
    "certificateCode",
    "certificateProofPath",
    "evaluationCompleted",
  ];

  const body = rows.map((row) => [
    row.participantName,
    row.professionalRegistrationNumber,
    row.courseTitle,
    row.completedAt,
    row.bestScorePercentage,
    row.attemptCount,
    yesNo(row.passed),
    yesNo(row.certificateAvailable),
    row.certificateCode,
    row.certificateProofPath,
    yesNo(row.evaluationCompleted),
  ].map(csvEscape).join(","));

  return [headers.join(","), ...body].join("\n");
}

export function buildParticipantReportDownload({
  rows,
  courseSlug,
  format,
}: {
  rows: ParticipantCompletionReport[];
  courseSlug: string;
  format: "csv" | "markdown";
}) {
  const safeSlug = slugify(courseSlug);

  if (format === "csv") {
    return {
      filename: `deelnemerrapportage-${safeSlug}.csv`,
      contentType: "text/csv; charset=utf-8",
      body: exportParticipantCompletionReportCsv(rows),
    };
  }

  return {
    filename: `deelnemerrapportage-${safeSlug}.md`,
    contentType: "text/markdown; charset=utf-8",
    body: exportParticipantCompletionReportMarkdown(rows),
  };
}
