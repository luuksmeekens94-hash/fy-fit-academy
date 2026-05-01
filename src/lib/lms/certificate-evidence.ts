import type { AccreditationKind } from "@prisma/client";


export type CertificateEvidenceInput = {
  certificateId: string;
  userId: string;
  courseId: string;
  certificateCode: string;
  participantName: string;
  professionalRegistrationNumber: string | null;
  courseTitle: string;
  completedAt: Date | null;
  issuedAt: Date;
  scorePercentage: number | null;
  attemptCount: number;
  evaluationCompleted: boolean;
  studyLoadMinutes: number | null;
  versionNumber: string;
  accreditationRegister: string | null;
  accreditationKind: AccreditationKind;
};

export type CertificateEvidence = {
  certificateId: string;
  certificateCode: string;
  participantName: string;
  professionalRegistrationNumber: string;
  courseTitle: string;
  completedAt: string;
  issuedAt: string;
  scorePercentage: string;
  attemptCount: string;
  evaluationCompleted: "ja" | "nee";
  studyLoad: string;
  versionNumber: string;
  accreditationRegister: string;
  accreditationKind: string;
  status: "behaald";
};

function formatDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "Niet vastgelegd";
}

function formatScore(value: number | null) {
  return value === null ? "Niet beschikbaar" : `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function formatAttemptCount(value: number) {
  return value > 0 ? String(value) : "Niet beschikbaar";
}

function formatStudyLoad(minutes: number | null) {
  if (minutes === null) {
    return "Niet vastgelegd";
  }

  if (minutes % 60 === 0) {
    return `${minutes / 60} uur`;
  }

  if (minutes < 60) {
    return `${minutes} minuten`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} uur ${remainder} minuten`;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "certificaat";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function evidenceRow(label: string, value: string) {
  return `<div class="evidence-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function normalizeCertificateRegistrationNumber(value: string | null | undefined) {
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

export function buildCertificateEvidence(input: CertificateEvidenceInput): CertificateEvidence {
  return {
    certificateId: input.certificateId,
    certificateCode: input.certificateCode,
    participantName: input.participantName,
    professionalRegistrationNumber:
      normalizeCertificateRegistrationNumber(input.professionalRegistrationNumber) ?? "Niet vastgelegd",
    courseTitle: input.courseTitle,
    completedAt: formatDate(input.completedAt),
    issuedAt: formatDate(input.issuedAt),
    scorePercentage: formatScore(input.scorePercentage),
    attemptCount: formatAttemptCount(input.attemptCount),
    evaluationCompleted: input.evaluationCompleted ? "ja" : "nee",
    studyLoad: formatStudyLoad(input.studyLoadMinutes),
    versionNumber: input.versionNumber,
    accreditationRegister: input.accreditationRegister?.trim() || "Niet vastgelegd",
    accreditationKind: input.accreditationKind,
    status: "behaald",
  };
}

export function renderCertificateHtml(input: CertificateEvidenceInput) {
  const evidence = buildCertificateEvidence(input);
  const rows = [
    evidenceRow("Deelnemer", evidence.participantName),
    evidenceRow("Registratienummer", evidence.professionalRegistrationNumber),
    evidenceRow("E-learning", evidence.courseTitle),
    evidenceRow("Status", evidence.status),
    evidenceRow("Datum afronding", evidence.completedAt),
    evidenceRow("Toetsscore", evidence.scorePercentage),
    evidenceRow("Aantal pogingen", evidence.attemptCount),
    evidenceRow("Evaluatie ingevuld", evidence.evaluationCompleted),
    evidenceRow("Studielast", evidence.studyLoad),
    evidenceRow("Versie", evidence.versionNumber),
    evidenceRow("Accreditatieregister", evidence.accreditationRegister),
    evidenceRow("Accreditatietype", evidence.accreditationKind),
    evidenceRow("Certificaatcode", evidence.certificateCode),
    evidenceRow("Uitgiftedatum", evidence.issuedAt),
  ].join("");

  return `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Certificaat ${escapeHtml(evidence.certificateCode)}</title>
  <style>
    :root { color-scheme: light; --brand: #0f766e; --ink: #0f172a; --muted: #64748b; --line: #dbeafe; --soft: #f0fdfa; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #e2e8f0; color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .toolbar { display: flex; justify-content: center; gap: 12px; padding: 20px; }
    .button { border: 0; border-radius: 999px; background: var(--brand); color: white; cursor: pointer; font-weight: 800; padding: 12px 18px; text-decoration: none; }
    .sheet { width: min(1120px, calc(100vw - 32px)); min-height: 760px; margin: 0 auto 32px; background: white; border: 1px solid var(--line); border-radius: 34px; box-shadow: 0 28px 70px rgba(15, 23, 42, 0.16); overflow: hidden; }
    .ribbon { display: flex; align-items: center; justify-content: space-between; gap: 24px; background: linear-gradient(135deg, #0f766e, #0ea5a4 56%, #7dd3fc); color: white; padding: 34px 42px; }
    .brand { font-size: 14px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; }
    .code { border: 1px solid rgba(255,255,255,0.42); border-radius: 999px; padding: 10px 14px; font-size: 13px; font-weight: 800; }
    main { padding: 48px 56px 42px; }
    .eyebrow { color: var(--brand); font-size: 13px; font-weight: 900; letter-spacing: 0.24em; text-transform: uppercase; }
    h1 { margin: 14px 0 10px; font-family: Georgia, "Times New Roman", serif; font-size: clamp(44px, 7vw, 78px); line-height: 0.95; }
    .lead { max-width: 820px; color: var(--muted); font-size: 18px; line-height: 1.8; }
    .participant { margin: 26px 0; border-bottom: 3px solid var(--brand); display: inline-block; font-size: clamp(30px, 5vw, 52px); font-weight: 900; line-height: 1.1; padding-bottom: 8px; }
    .course { border-radius: 28px; background: var(--soft); padding: 24px 28px; }
    .course-label { color: var(--brand); font-size: 12px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; }
    .course-title { margin-top: 8px; font-size: 28px; font-weight: 900; }
    dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 28px 0 0; }
    .evidence-row { border: 1px solid #e2e8f0; border-radius: 18px; padding: 14px 16px; break-inside: avoid; }
    dt { color: var(--muted); font-size: 11px; font-weight: 900; letter-spacing: 0.16em; margin-bottom: 7px; text-transform: uppercase; }
    dd { font-size: 16px; font-weight: 800; margin: 0; }
    .footer { align-items: end; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; gap: 24px; margin-top: 34px; padding-top: 24px; }
    .signature { min-width: 280px; text-align: right; }
    .signature-line { border-top: 2px solid var(--ink); margin-bottom: 8px; padding-top: 8px; }
    .small { color: var(--muted); font-size: 12px; line-height: 1.7; }
    @media (max-width: 760px) { main { padding: 32px 24px; } .ribbon { padding: 26px 24px; } dl { grid-template-columns: 1fr; } .footer { align-items: start; flex-direction: column; } .signature { text-align: left; width: 100%; } }
    @media print { @page { size: A4 landscape; margin: 10mm; } body { background: white; } .toolbar { display: none; } .sheet { border: 0; border-radius: 0; box-shadow: none; margin: 0; min-height: auto; width: 100%; } main { padding: 34px 40px 28px; } .ribbon { padding: 28px 36px; } dl { gap: 10px; } .evidence-row { padding: 10px 12px; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="button" onclick="window.print()">Download / print als PDF</button>
  </div>
  <article class="sheet" aria-label="Certificaat/deelnamebewijs">
    <header class="ribbon">
      <div class="brand">Fy-Fit Academy</div>
      <div class="code">${escapeHtml(evidence.certificateCode)}</div>
    </header>
    <main>
      <div class="eyebrow">Certificaat/deelnamebewijs</div>
      <h1>Bewijs van afronding</h1>
      <p class="lead">Hiermee verklaart Fy-Fit Academy dat onderstaande deelnemer de e-learning volgens de LMS-afrondingsregels succesvol heeft afgerond.</p>
      <div class="participant">${escapeHtml(evidence.participantName)}</div>
      <section class="course">
        <div class="course-label">E-learning</div>
        <div class="course-title">${escapeHtml(evidence.courseTitle)}</div>
      </section>
      <dl>${rows}</dl>
      <footer class="footer">
        <p class="small">Dit bewijs is opgebouwd uit LMS-gegevens: afrondingsdatum, toetsresultaat, aantal pogingen, evaluatiestatus, versie en certificaatcode. Registratienummer wordt getoond indien vastgelegd in het gebruikersprofiel.</p>
        <div class="signature">
          <div class="signature-line">Fy-Fit Academy</div>
          <div class="small">Interne scholing & accreditatiebewijs</div>
        </div>
      </footer>
    </main>
  </article>
</body>
</html>`;
}

export function buildCertificateDownload(input: CertificateEvidenceInput) {
  const evidence = buildCertificateEvidence(input);
  const safeCourse = slugify(evidence.courseTitle);
  const safeCode = slugify(evidence.certificateCode);

  return {
    filename: `certificaat-${safeCourse}-${safeCode}.html`,
    contentType: "text/html; charset=utf-8",
    body: renderCertificateHtml(input),
  };
}
