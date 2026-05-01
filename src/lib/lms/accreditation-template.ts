export type StandardEvaluationQuestion = {
  domain: string;
  label: string;
  type: "SCALE_1_5" | "TEXT" | "YES_NO";
  order: number;
  isRequired: boolean;
};

export type AccreditationDossierPolishInput = {
  isPublishable: boolean;
  hasStandardEvaluationTemplate: boolean;
  hasEvidenceExport: boolean;
  hasParticipantReport: boolean;
  hasReviewerPreview: boolean;
  hasCertificateProofDownloads: boolean;
  hasChangeLog: boolean;
  hasRemainingCertificateEvidenceGaps: boolean;
};

export type AccreditationDossierPolishItem = {
  id: string;
  label: string;
  status: "complete" | "missing" | "warning";
  severity: "critical" | "warning";
  message: string;
};

export type AccreditationDossierPolishChecklist = {
  isReadyToSubmit: boolean;
  openCriticalCount: number;
  warningCount: number;
  completedCount: number;
  totalCount: number;
  summary: string;
  items: AccreditationDossierPolishItem[];
};

export const STANDARD_EVALUATION_FORM_TITLE = "Standaardevaluatie Kwaliteitshuis Fysiotherapie";

export function buildStandardEvaluationQuestionTemplate(): StandardEvaluationQuestion[] {
  return [
    {
      domain: "niveau-diepgang",
      label: "Niveau/diepgang: de inhoud had voldoende diepgang voor mijn fysiotherapeutisch handelen.",
      type: "SCALE_1_5",
      order: 1,
      isRequired: true,
    },
    {
      domain: "praktijkrelevantie",
      label: "Praktijkrelevantie: de scholing sluit aan bij herkenbare situaties uit de fysiotherapiepraktijk.",
      type: "SCALE_1_5",
      order: 2,
      isRequired: true,
    },
    {
      domain: "toepasbaarheid",
      label: "Toepasbaarheid: ik kan de opgedane kennis direct toepassen in mijn werk.",
      type: "SCALE_1_5",
      order: 3,
      isRequired: true,
    },
    {
      domain: "kwaliteit-leerstof",
      label: "Kwaliteit leerstof: de leerstof, voorbeelden en bronnen waren duidelijk en professioneel.",
      type: "SCALE_1_5",
      order: 4,
      isRequired: true,
    },
    {
      domain: "toets-aansluiting",
      label: "Toets passend bij leerstof: de toetsvragen sloten inhoudelijk aan op de behandelde stof en leerdoelen.",
      type: "SCALE_1_5",
      order: 5,
      isRequired: true,
    },
    {
      domain: "studielast",
      label: "Geschatte versus werkelijke studielast: de opgegeven studielast kwam overeen met mijn daadwerkelijke tijdsbesteding.",
      type: "SCALE_1_5",
      order: 6,
      isRequired: true,
    },
    {
      domain: "verbeterpunten",
      label: "Welke verbeterpunten of opmerkingen heb je voor deze e-learning?",
      type: "TEXT",
      order: 7,
      isRequired: true,
    },
  ];
}

export function formatStandardEvaluationQuestionsForDossier(questions = buildStandardEvaluationQuestionTemplate()) {
  return questions
    .map((question) => `${question.order}. [${question.type}] ${question.label}`)
    .join("\n");
}

function polishItem(
  id: string,
  label: string,
  passed: boolean,
  completeMessage: string,
  missingMessage: string,
  severity: "critical" | "warning" = "critical",
): AccreditationDossierPolishItem {
  return {
    id,
    label,
    status: passed ? "complete" : severity === "warning" ? "warning" : "missing",
    severity,
    message: passed ? completeMessage : missingMessage,
  };
}

export function buildAccreditationDossierPolishChecklist(
  input: AccreditationDossierPolishInput,
): AccreditationDossierPolishChecklist {
  const items: AccreditationDossierPolishItem[] = [
    polishItem(
      "publish-gate",
      "Groene publicatiechecklist",
      input.isPublishable,
      "Alle kritieke Kwaliteitshuis-checks zijn groen.",
      "Los eerst de kritieke accreditatieblokkades op.",
    ),
    polishItem(
      "standard-evaluation-template",
      "Standaardevaluatie aanwezig",
      input.hasStandardEvaluationTemplate,
      "De evaluatie dekt niveau, relevantie, toepasbaarheid, leerstofkwaliteit, toets-aansluiting, studielast en verbeterpunten.",
      "Pas de standaard Kwaliteitshuis-evaluatie toe of controleer handmatig of alle evaluatiedomeinen aanwezig zijn.",
    ),
    polishItem(
      "evidence-export",
      "Accreditatiedossier exporteerbaar",
      input.hasEvidenceExport,
      "Het Markdown-dossier bevat de benodigde indieningsonderdelen.",
      "Maak het accreditatiedossier exporteerbaar voor indiening.",
    ),
    polishItem(
      "participant-report",
      "Deelnemerrapportage exporteerbaar",
      input.hasParticipantReport,
      "CSV/Markdown rapportage per deelnemer is beschikbaar.",
      "Zorg dat deelnemerrapportage als CSV/Markdown beschikbaar is.",
    ),
    polishItem(
      "reviewer-preview",
      "Reviewer-preview zonder datavervuiling",
      input.hasReviewerPreview,
      "Reviewer/commissie kan veilig previewen zonder voortgang of pogingen te schrijven.",
      "Richt reviewer-preview veilig in voordat je indient.",
    ),
    polishItem(
      "certificate-proof-downloads",
      "Certificaat/deelnamebewijs downloadbaar",
      input.hasCertificateProofDownloads,
      "Individuele certificaatbewijzen zijn downloadbaar.",
      "Maak certificaat-/deelnamebewijsdownloads beschikbaar.",
    ),
    polishItem(
      "change-log",
      "Versie- en wijzigingslog aanwezig",
      input.hasChangeLog,
      "Versie en wijzigingslog zijn zichtbaar in het dossier.",
      "Leg minimaal één inhoudelijke wijzigingslogregel vast.",
    ),
    polishItem(
      "historical-evidence-gaps",
      "Historische bewijsvelden gecontroleerd",
      !input.hasRemainingCertificateEvidenceGaps,
      "Er zijn geen bekende ontbrekende historische certificaatbewijsvelden.",
      "Er zijn nog ontbrekende historische bronvelden; vul echte profiel-/cursusdata aan en verzin niets.",
      "warning",
    ),
  ];

  const openCriticalCount = items.filter((item) => item.severity === "critical" && item.status !== "complete").length;
  const warningCount = items.filter((item) => item.status === "warning").length;
  const completedCount = items.filter((item) => item.status === "complete").length;
  const isReadyToSubmit = openCriticalCount === 0;

  return {
    isReadyToSubmit,
    openCriticalCount,
    warningCount,
    completedCount,
    totalCount: items.length,
    summary: isReadyToSubmit
      ? `Inzendklaar: ${completedCount}/${items.length} checks compleet${warningCount ? `, ${warningCount} waarschuwing(en)` : ""}.`
      : `Nog niet inzendklaar: ${openCriticalCount} kritieke blokkade(s), ${warningCount} waarschuwing(en).`,
    items,
  };
}
