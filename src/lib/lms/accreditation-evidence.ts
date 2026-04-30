import type { AccreditationChecklistResult } from "./accreditation-checklist";
import type { CourseDetail } from "./types";

function formatDate(value: Date | null) {
  if (!value) {
    return "Niet ingevuld";
  }

  return value.toISOString().slice(0, 10);
}

function formatKind(value: CourseDetail["accreditationKind"]) {
  return value === "VAKINHOUDELIJK" ? "Vakinhoudelijk" : "Beroepsgerelateerd";
}

function formatOptional(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Niet ingevuld";
  }

  return String(value);
}

function bullet(lines: string[]) {
  return lines.map((line) => `- ${line}`).join("\n");
}

export function assertAccreditationPublishable(checklist: AccreditationChecklistResult) {
  if (checklist.isPublishable) {
    return;
  }

  const blockers = checklist.items
    .filter((item) => item.severity === "critical" && item.status !== "complete")
    .map((item) => item.id)
    .join(", ");

  throw new Error(`Niet publiceerbaar: los eerst deze accreditatieblokkades op: ${blockers}.`);
}

export function buildAccreditationEvidenceExport(
  course: CourseDetail,
  checklist: AccreditationChecklistResult,
) {
  const version = course.activeVersion;
  const modules = version?.modules ?? [];
  const objectives = version?.objectives ?? [];
  const literature = version?.literature ?? [];
  const competencies = version?.competencies ?? [];
  const assessments = version?.assessments ?? [];
  const evaluations = version?.evaluationForms ?? [];
  const changeLogs = version?.changeLogs ?? [];

  const authorLines = course.authorExperts.length
    ? course.authorExperts.map((expert) =>
        `${expert.name} — ${expert.role}${expert.organization ? ` (${expert.organization})` : ""}${expert.registrationNumber ? ` — registratienr. ${expert.registrationNumber}` : ""}`
      )
    : ["Niet ingevuld"];

  const moduleLines = modules.length
    ? modules.map((module) => {
        const moduleObjectives = objectives.filter((objective) => objective.moduleId === module.id);
        const objectiveCodes = moduleObjectives.map((objective) => objective.code).join(", ") || "geen gekoppelde leerdoelen";
        return `Module ${module.order}: ${module.title} — ${module.estimatedMinutes} min — werkvormen: ${module.workForms.join(", ").toLowerCase()} — leerdoelen: ${objectiveCodes}`;
      })
    : ["Geen modules vastgelegd"];

  const assessmentLines = assessments.length
    ? assessments.map((assessment) =>
        `${assessment.title}: ${assessment.questionCount} vragen, ${assessment.passPercentage}% norm, max. ${assessment.maxAttempts} pogingen, vragen randomiseren: ${assessment.shuffleQuestions ? "ja" : "nee"}, antwoorden randomiseren: ${assessment.shuffleOptions ? "ja" : "nee"}, alle vragen aan leerdoelen gekoppeld: ${assessment.allQuestionsLinkedToObjectives ? "ja" : "nee"}, vereist voor certificaat: ${assessment.isRequiredForCompletion ? "ja" : "nee"}`
      )
    : ["Geen toets vastgelegd"];

  const checklistLines = checklist.items.map((item) =>
    `${item.status.toUpperCase()} — ${item.label}: ${item.message}`
  );

  return [
    `# Accreditatiedossier: ${course.title}`,
    "",
    "## Algemene gegevens",
    bullet([
      `Titel: ${course.title}`,
      `Doelgroep: ${formatOptional(course.audience)}`,
      `Register: ${formatOptional(course.accreditationRegister)}`,
      `Soort scholing: ${formatKind(course.accreditationKind)}`,
      `Totale studielast: ${course.studyLoadMinutes} minuten`,
      `Aantal modules: ${modules.length}`,
      `Versiedatum: ${formatDate(course.versionDate)}`,
      `Actieve versie: ${formatOptional(version?.versionNumber)}`,
      `Reviewer: ${formatOptional(course.reviewerName)}`,
      `Status: ${course.status}`,
    ]),
    "",
    "## Auteur(s) / inhoudsdeskundige(n)",
    bullet(authorLines),
    "",
    "## Checklist publiceerbaarheid",
    bullet([
      `Publiceerbaar: ${checklist.isPublishable ? "ja" : "nee"}`,
      `Kritieke blokkades: ${checklist.criticalOpenCount}`,
      `Waarschuwingen: ${checklist.warningCount}`,
      ...checklistLines,
    ]),
    "",
    "## Leerdoelen",
    objectives.length
      ? bullet(objectives.map((objective) => `${objective.code}: ${objective.text}`))
      : "- Geen leerdoelen vastgelegd",
    "",
    "## Modules",
    bullet(moduleLines),
    "",
    "## Literatuur en richtlijnen",
    literature.length
      ? bullet(literature.map((reference) => `${reference.title}${reference.guideline ? ` — ${reference.guideline}` : ""}${reference.source ? ` — ${reference.source}` : ""}${reference.year ? ` (${reference.year})` : ""}`))
      : "- Geen literatuur vastgelegd",
    "",
    "## Competenties",
    competencies.length
      ? bullet(competencies.map((competency) => `${competency.name}${competency.framework ? ` — ${competency.framework}` : ""}${competency.description ? ` — ${competency.description}` : ""}`))
      : "- Geen competenties vastgelegd",
    "",
    "## Toetsing",
    bullet(assessmentLines),
    "",
    "## Evaluatie",
    evaluations.length
      ? bullet(evaluations.map((evaluation) => `${evaluation.title}: ${evaluation.questionCount} vragen, verplicht: ${evaluation.isRequired ? "ja" : "nee"}`))
      : "- Geen evaluatieformulier vastgelegd",
    "",
    "## Bewijs van afronding / rapportagevelden",
    bullet([
      "Naam deelnemer",
      "BIG/KRF/SKF/registratienummer indien relevant",
      "E-learning titel",
      "Datum afronding",
      "Toetsscore",
      "Aantal pogingen",
      "Behaalde status",
      "Certificaat/deelnamebewijs",
      "Evaluatie ingevuld: ja/nee",
    ]),
    "",
    "## Wijzigingslog",
    changeLogs.length
      ? bullet(changeLogs.map((entry) => `${formatDate(entry.changedAt)} — ${entry.changeType} — ${entry.summary} — ${entry.changedByName}`))
      : "- Geen wijzigingslog vastgelegd",
    "",
  ].join("\n");
}
