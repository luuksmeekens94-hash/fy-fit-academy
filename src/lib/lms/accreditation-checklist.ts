import type { WorkForm } from "@prisma/client";

export type AccreditationChecklistStatus = "complete" | "missing" | "warning";
export type AccreditationChecklistSeverity = "critical" | "warning";

export type AccreditationChecklistItem = {
  id: string;
  label: string;
  status: AccreditationChecklistStatus;
  severity: AccreditationChecklistSeverity;
  message: string;
};

export type AccreditationChecklistResult = {
  isPublishable: boolean;
  criticalOpenCount: number;
  warningCount: number;
  completedCount: number;
  totalCount: number;
  moduleMinutes: number;
  items: AccreditationChecklistItem[];
};

type ChecklistCourse = {
  title: string | null;
  audience: string | null;
  accreditationRegister: string | null;
  accreditationKind: string | null;
  accreditationActivityId?: string | null;
  providerName?: string | null;
  providerSignatureName?: string | null;
  studyLoadMinutes: number | null;
  versionDate: Date | null;
  authorExperts: { name: string; role: string }[];
  requiredQuestionCount: number | null;
  reviewerName: string | null;
  activeVersion: {
    versionNumber: string;
    modules: {
      id: string;
      title: string;
      estimatedMinutes: number;
      introduction: string | null;
      summary: string | null;
      workForms: WorkForm[];
    }[];
    objectives: {
      id: string;
      moduleId: string | null;
      code: string;
      text: string;
    }[];
    literature: { id: string; moduleId: string | null; title: string; guideline: string | null }[];
    competencies: { id: string; moduleId: string | null; name: string }[];
    evaluationForms: { id: string; title: string; isRequired: boolean; questionCount: number }[];
    assessments: {
      id: string;
      title: string;
      passPercentage: number;
      maxAttempts: number;
      shuffleQuestions?: boolean;
      shuffleOptions: boolean;
      questionCount?: number;
      allQuestionsLinkedToObjectives?: boolean;
      coveredObjectiveIds?: string[];
    }[];
    lessons: { id: string; moduleId: string | null; title: string; estimatedMinutes: number; isRequired: boolean; content?: string | null }[];
  } | null;
  changeLogCount: number;
};

function isFilled(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function item(
  id: string,
  label: string,
  passed: boolean,
  message: string,
  severity: AccreditationChecklistSeverity = "critical",
): AccreditationChecklistItem {
  return {
    id,
    label,
    status: passed ? "complete" : severity === "warning" ? "warning" : "missing",
    severity,
    message,
  };
}

export function getMinimumQuestionCountForAsyncElearning(minutes: number | null | undefined) {
  const duration = minutes ?? 0;

  if (duration >= 121) {
    return 15;
  }

  if (duration >= 61) {
    return 10;
  }

  if (duration >= 30) {
    return 5;
  }

  return 1;
}

function containsCommercialLink(text: string | null | undefined) {
  if (!text) {
    return false;
  }

  const hasUrl = /https?:\/\/\S+/i.test(text);
  const hasCommercialLanguage = /\b(shop|store|koop|kopen|aanbieding|korting|product|bestel|purchase|discount)\b/i.test(text);

  return hasUrl && hasCommercialLanguage;
}

export function buildAccreditationChecklist(course: ChecklistCourse): AccreditationChecklistResult {
  const version = course.activeVersion;
  const modules = version?.modules ?? [];
  const objectives = version?.objectives ?? [];
  const literature = version?.literature ?? [];
  const competencies = version?.competencies ?? [];
  const evaluations = version?.evaluationForms ?? [];
  const assessments = version?.assessments ?? [];
  const lessons = version?.lessons ?? [];
  const moduleMinutes = modules.reduce((total, module) => total + module.estimatedMinutes, 0);
  const officialMinimumQuestionCount = Math.max(
    course.requiredQuestionCount ?? 1,
    getMinimumQuestionCountForAsyncElearning(course.studyLoadMinutes ?? moduleMinutes),
  );

  const generalMetadataComplete =
    isFilled(course.title) &&
    isFilled(course.audience) &&
    isFilled(course.accreditationRegister) &&
    isFilled(course.accreditationKind) &&
    isFilled(course.accreditationActivityId) &&
    isFilled(course.providerName) &&
    isFilled(course.providerSignatureName) &&
    (course.studyLoadMinutes ?? 0) > 0 &&
    course.versionDate instanceof Date &&
    course.authorExperts.length > 0;

  const objectivesComplete = objectives.length >= 3 && objectives.length <= 6;
  const moduleObjectiveIds = new Set(objectives.filter((objective) => objective.moduleId).map((objective) => objective.moduleId));
  const modulesComplete =
    modules.length > 0 &&
    modules.every(
      (module) =>
        isFilled(module.title) &&
        module.estimatedMinutes > 0 &&
        moduleObjectiveIds.has(module.id) &&
        (isFilled(module.introduction) || lessons.some((lesson) => lesson.moduleId === module.id)) &&
        isFilled(module.summary) &&
        module.workForms.length > 0,
    );

  const moduleCountWithinKwaliteitshuisLimit = modules.length > 0 && modules.length <= 6;
  const moduleDurationsWithinKwaliteitshuisLimit = modules.length > 0 && modules.every((module) => module.estimatedMinutes <= 180);

  const assessmentPassNormsComplete =
    assessments.length > 0 && assessments.every((assessment) => assessment.passPercentage >= 70);
  const assessmentAttemptRulesComplete =
    assessments.length > 0 && assessments.every((assessment) => assessment.maxAttempts === 3);
  const assessmentRandomizationComplete =
    assessments.length > 0 &&
    assessments.every((assessment) => assessment.shuffleQuestions !== false && assessment.shuffleOptions);
  const assessmentQuestionCountsComplete =
    assessments.length > 0 &&
    assessments.every((assessment) => (assessment.questionCount ?? 0) >= officialMinimumQuestionCount);
  const assessmentObjectiveLinksComplete =
    assessments.length > 0 && assessments.every((assessment) => assessment.allQuestionsLinkedToObjectives === true);
  const coveredObjectiveIds = new Set(assessments.flatMap((assessment) => assessment.coveredObjectiveIds ?? []));
  const assessmentObjectiveCoverageComplete =
    objectives.length > 0 && objectives.every((objective) => coveredObjectiveIds.has(objective.id));
  const commercialLinksClear = lessons.every((lesson) => !containsCommercialLink(lesson.content));

  const assessmentsComplete =
    assessmentPassNormsComplete &&
    assessmentAttemptRulesComplete &&
    assessmentRandomizationComplete &&
    assessmentQuestionCountsComplete &&
    assessmentObjectiveLinksComplete &&
    assessmentObjectiveCoverageComplete;

  const studyLoadMatches = course.studyLoadMinutes === null || moduleMinutes === course.studyLoadMinutes;

  const items: AccreditationChecklistItem[] = [
    item(
      "general-metadata",
      "Algemene accreditatiegegevens",
      generalMetadataComplete,
      generalMetadataComplete
        ? "Titel, doelgroep, register, soort, activiteit-ID, aanbieder, ondertekenaar, studielast, auteurs en versiedatum zijn ingevuld."
        : "Vul titel, doelgroep, register, soort, activiteit-ID, aanbieder, ondertekenaar, studielast, auteurs en versiedatum aan.",
    ),
    item(
      "learning-objectives",
      "3–6 leerdoelen",
      objectivesComplete,
      objectivesComplete
        ? "Het aantal leerdoelen past binnen de accreditatienorm."
        : "Zorg voor minimaal 3 en maximaal 6 concrete leerdoelen.",
    ),
    item(
      "modules",
      "Modulestructuur compleet",
      modulesComplete,
      modulesComplete
        ? "Modules bevatten duur, leerdoel, inhoud/samenvatting en werkvorm."
        : "Elke module heeft titel, duur, leerdoel, inhoud/samenvatting en werkvorm nodig.",
    ),
    item(
      "module-count",
      "Maximaal 6 modules",
      moduleCountWithinKwaliteitshuisLimit,
      moduleCountWithinKwaliteitshuisLimit
        ? "Aantal modules past binnen de Kwaliteitshuis-eis."
        : "Beperk de e-learning tot maximaal 6 modules.",
    ),
    item(
      "module-duration",
      "Maximaal 3 uur per module",
      moduleDurationsWithinKwaliteitshuisLimit,
      moduleDurationsWithinKwaliteitshuisLimit
        ? "Elke module blijft binnen maximaal 180 minuten."
        : "Elke module mag maximaal 3 uur / 180 minuten duren.",
    ),
    item(
      "literature",
      "Literatuur/richtlijnen",
      literature.length > 0,
      literature.length > 0 ? "Literatuur of richtlijnen zijn vastgelegd." : "Voeg literatuur of richtlijnen toe.",
    ),
    item(
      "competencies",
      "Competenties/richtlijnkoppeling",
      competencies.length > 0,
      competencies.length > 0 ? "Competenties zijn gekoppeld." : "Koppel minimaal één fysiotherapeutische competentie of richtlijn.",
    ),
    item(
      "assessment-rules",
      "Toetsnormen",
      assessmentsComplete,
      assessmentsComplete
        ? "Toets voldoet aan minimaal 70%, max. 3 pogingen, randomisatie, vraagenaantal en leerdoelkoppeling."
        : "Controleer toets: minimaal 70%, max. 3 pogingen, randomisatie, vraagenaantal en leerdoelkoppeling.",
    ),
    item(
      "assessment-pass-norm",
      "Toetsnorm minimaal 70%",
      assessmentPassNormsComplete,
      assessmentPassNormsComplete ? "Slagingsnorm is minimaal 70%." : "Stel de toetsnorm in op minimaal 70% correct.",
    ),
    item(
      "assessment-question-count",
      "Vraagenaantal past bij duur",
      assessmentQuestionCountsComplete,
      assessmentQuestionCountsComplete
        ? `Vraagenaantal voldoet aan de duurstaffel (${officialMinimumQuestionCount} vereist).`
        : `Voeg minimaal ${officialMinimumQuestionCount} toetsvragen toe voor deze e-learningduur.`,
    ),
    item(
      "assessment-randomization",
      "Randomisatie bij toets/herkansing",
      assessmentRandomizationComplete,
      assessmentRandomizationComplete
        ? "Vraag- en antwoordvolgorde worden gerandomiseerd."
        : "Zet randomisatie van vragen en antwoordopties aan, zodat herkansingen voldoen.",
    ),
    item(
      "assessment-objective-coverage",
      "Toets dekt alle leerdoelen",
      assessmentObjectiveCoverageComplete,
      assessmentObjectiveCoverageComplete
        ? "Alle leerdoelen zijn aantoonbaar afgedekt door toetsvragen."
        : "Koppel toetsvragen zo dat elk leerdoel minimaal één vraag heeft.",
    ),
    item(
      "commercial-links",
      "Geen commerciële hyperlinks",
      commercialLinksClear,
      commercialLinksClear
        ? "Er zijn geen verdachte commerciële hyperlinks in lescontent gevonden."
        : "Verwijder commerciële hyperlinks uit de e-learning of vervang ze door ondersteunende bronverwijzingen.",
    ),
    item(
      "evaluation",
      "Evaluatieformulier",
      evaluations.some((form) => form.isRequired && form.questionCount >= 7),
      "Standaardevaluatie met minimaal 7 vragen is aanwezig of vereist.",
    ),
    item(
      "reviewer-preview",
      "Reviewer-preview",
      isFilled(course.reviewerName),
      isFilled(course.reviewerName) ? "Reviewer-account is gekoppeld." : "Koppel een reviewer-account voor accreditatiecommissie.",
    ),
    item(
      "versioning",
      "Versie en wijzigingslog",
      Boolean(version?.versionNumber) && course.changeLogCount > 0,
      "Versienummer en minimaal één wijzigingslogregel zijn nodig.",
    ),
    item(
      "study-load-balance",
      "Moduleduur versus studielast",
      studyLoadMatches,
      studyLoadMatches
        ? "Som van moduleduur komt overeen met totale studielast."
        : `Som moduleduur (${moduleMinutes} min) wijkt af van studielast (${course.studyLoadMinutes ?? 0} min).`,
      "warning",
    ),
  ];

  const criticalOpenCount = items.filter((entry) => entry.severity === "critical" && entry.status !== "complete").length;
  const warningCount = items.filter((entry) => entry.status === "warning").length;
  const completedCount = items.filter((entry) => entry.status === "complete").length;

  return {
    isPublishable: criticalOpenCount === 0,
    criticalOpenCount,
    warningCount,
    completedCount,
    totalCount: items.length,
    moduleMinutes,
    items,
  };
}
