import {
  applyStandardEvaluationTemplateAction,
  deleteAssessmentQuestionAction,
  deleteCourseBuilderModuleAction,
  duplicateCourseBuilderModuleAction,
  moveCourseBuilderModuleAction,
  publishCourseAccreditationReadyAction,
  saveAssessmentBuilderAction,
  saveAssessmentQuestionAction,
  saveCourseAccreditationMetadataAction,
  saveCourseAccreditationStructureAction,
  saveCourseBuilderLessonAction,
  saveCourseBuilderModuleAction,
} from "@/app/lms-actions";
import { StatusBadge } from "@/components/status-badge";
import { AUDIENCE_PROFILE_OPTIONS } from "@/lib/audience";
import {
  CONTENT_VISIBILITY_PRESET_OPTIONS,
  summarizeContentVisibility,
} from "@/lib/content-visibility";
import { getRoleLabel } from "@/lib/roles";
import { buildAccreditationChecklist } from "@/lib/lms/accreditation-checklist";
import { buildAccreditationEvidenceExport } from "@/lib/lms/accreditation-evidence";
import {
  buildAccreditationDossierPolishChecklist,
  buildStandardEvaluationQuestionTemplate,
  STANDARD_EVALUATION_FORM_TITLE,
} from "@/lib/lms/accreditation-template";
import {
  exportParticipantCompletionReportCsv,
  exportParticipantCompletionReportMarkdown,
  exportPeOnlinePresenceCsv,
  type ParticipantCompletionReport,
} from "@/lib/lms/participant-report";
import { extractLessonMedia } from "@/lib/lms/lesson-media";
import type { CourseDetail } from "@/lib/lms/types";


function formatInputDate(date: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatAuthorExperts(experts: CourseDetail["authorExperts"]) {
  return experts
    .map((expert) => [expert.name, expert.role, expert.organization ?? "", expert.registrationNumber ?? ""].join("||"))
    .join("\n");
}

function formatModules(course: CourseDetail) {
  return (course.activeVersion?.modules ?? [])
    .map((module) => [
      module.order,
      module.title,
      module.estimatedMinutes,
      module.introduction ?? "",
      module.summary ?? "",
      module.workForms.join(", ").toLowerCase(),
    ].join("||"))
    .join("\n");
}

function formatObjectives(course: CourseDetail) {
  const modulesById = new Map((course.activeVersion?.modules ?? []).map((module) => [module.id, module.order]));

  return (course.activeVersion?.objectives ?? [])
    .map((objective) => [objective.code, objective.text, objective.moduleId ? modulesById.get(objective.moduleId) ?? "" : ""].join("||"))
    .join("\n");
}

function formatLiterature(course: CourseDetail) {
  const modulesById = new Map((course.activeVersion?.modules ?? []).map((module) => [module.id, module.order]));

  return (course.activeVersion?.literature ?? [])
    .map((reference) => [
      reference.order,
      reference.title,
      reference.source ?? "",
      reference.url ?? "",
      reference.guideline ?? "",
      reference.year ?? "",
      reference.moduleId ? modulesById.get(reference.moduleId) ?? "" : "",
    ].join("||"))
    .join("\n");
}

function formatCompetencies(course: CourseDetail) {
  const modulesById = new Map((course.activeVersion?.modules ?? []).map((module) => [module.id, module.order]));

  return (course.activeVersion?.competencies ?? [])
    .map((reference) => [
      reference.name,
      reference.framework ?? "",
      reference.description ?? "",
      reference.moduleId ? modulesById.get(reference.moduleId) ?? "" : "",
    ].join("||"))
    .join("\n");
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Nog niet ingevuld";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatKind(kind: CourseDetail["accreditationKind"]) {
  return kind === "VAKINHOUDELIJK" ? "Vakinhoudelijk" : "Beroepsgerelateerd";
}

function formatWorkForm(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

function buildDataDownloadHref(content: string, mimeType: string) {
  return `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
}

function formatQuestionOptionsForInput(options: { label: string; isCorrect: boolean }[]) {
  return options.map((option) => `${option.label}||${option.isCorrect ? "true" : "false"}`).join("\n");
}

function formatLessonMediaSummary(content?: string | null) {
  const media = extractLessonMedia(content ?? "");
  const parts = [
    media.videos.length ? `${media.videos.length} video${media.videos.length === 1 ? "" : "'s"}` : null,
    media.documents.length ? `${media.documents.length} document${media.documents.length === 1 ? "" : "en"}` : null,
    media.images.length ? `${media.images.length} afbeelding${media.images.length === 1 ? "" : "en"}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" • ") : "geen media gekoppeld";
}

function formatQuestionType(type: string) {
  const labels: Record<string, string> = {
    MULTIPLE_CHOICE: "Single choice",
    MULTIPLE_RESPONSE: "Multiple response",
    TRUE_FALSE: "Waar/onwaar",
    OPEN_TEXT: "Open tekst",
  };

  return labels[type] ?? type;
}

function getLessonTitle(lessons: NonNullable<CourseDetail["activeVersion"]>["lessons"], lessonId: string | null) {
  if (!lessonId) {
    return "Niet gekoppeld aan een toetsles";
  }

  return lessons.find((lesson) => lesson.id === lessonId)?.title ?? "Onbekende les";
}

function formatAssessmentObjectiveCodes(
  objectives: NonNullable<CourseDetail["activeVersion"]>["objectives"],
  objectiveIds: string[],
) {
  return objectiveIds
    .map((objectiveId) => objectives.find((objective) => objective.id === objectiveId)?.code)
    .filter(Boolean)
    .join(", ");
}

function formatObjectiveCoverage(course: CourseDetail, assessment: CourseDetail["activeVersion"] extends null ? never : NonNullable<CourseDetail["activeVersion"]>["assessments"][number]) {
  const objectives = course.activeVersion?.objectives ?? [];
  const covered = objectives.filter((objective) => assessment.coveredObjectiveIds.includes(objective.id));
  const missing = objectives.filter((objective) => !assessment.coveredObjectiveIds.includes(objective.id));

  return {
    coveredCodes: covered.map((objective) => objective.code),
    missingCodes: missing.map((objective) => objective.code),
  };
}

function formatModuleAssessmentCoverage(course: CourseDetail) {
  const modules = course.activeVersion?.modules ?? [];
  const lessons = course.activeVersion?.lessons ?? [];
  const assessments = course.activeVersion?.assessments ?? [];

  return modules.map((module) => {
    const moduleLessonIds = lessons
      .filter((lesson) => lesson.moduleId === module.id)
      .map((lesson) => lesson.id);
    const linkedAssessments = assessments.filter(
      (assessment) => assessment.lessonId && moduleLessonIds.includes(assessment.lessonId),
    );

    return {
      module,
      linkedAssessments,
    };
  });
}

function getChecklistTone(status: "complete" | "missing" | "warning") {
  if (status === "complete") {
    return "success" as const;
  }

  if (status === "warning") {
    return "warning" as const;
  }

  return "neutral" as const;
}

const COURSE_VISIBILITY_ROLE_OPTIONS = [
  "MEDEWERKER",
  "TEAMLEIDER",
  "PRAKTIJKMANAGER",
  "PRAKTIJKHOUDER",
  "BEHEERDER",
  "REVIEWER",
] as const;

type AccreditationPanelProps = {
  course: CourseDetail;
  mode?: "beheer" | "reviewer";
  completionReport?: ParticipantCompletionReport[];
};

export function AccreditationPanel({ course, mode = "beheer", completionReport = [] }: AccreditationPanelProps) {
  const checklist = buildAccreditationChecklist({
    title: course.title,
    audience: course.audience,
    accreditationRegister: course.accreditationRegister,
    accreditationKind: course.accreditationKind,
    accreditationActivityId: course.accreditationActivityId,
    providerName: course.providerName,
    providerSignatureName: course.providerSignatureName,
    studyLoadMinutes: course.studyLoadMinutes,
    versionDate: course.versionDate,
    authorExperts: course.authorExperts,
    requiredQuestionCount: course.requiredQuestionCount,
    reviewerName: course.reviewerName,
    activeVersion: course.activeVersion,
    changeLogCount: course.activeVersion?.changeLogs.length ?? 0,
  });

  const modules = course.activeVersion?.modules ?? [];
  const lessons = course.activeVersion?.lessons ?? [];
  const objectives = course.activeVersion?.objectives ?? [];
  const literature = course.activeVersion?.literature ?? [];
  const competencies = course.activeVersion?.competencies ?? [];
  const assessments = course.activeVersion?.assessments ?? [];
  const evaluationForms = course.activeVersion?.evaluationForms ?? [];
  const changeLogs = course.activeVersion?.changeLogs ?? [];
  const standardEvaluationQuestions = buildStandardEvaluationQuestionTemplate();
  const hasStandardEvaluationTemplate = evaluationForms.some(
    (form) => form.title === STANDARD_EVALUATION_FORM_TITLE && form.isRequired && form.questionCount >= standardEvaluationQuestions.length,
  );
  const dossierPolish = buildAccreditationDossierPolishChecklist({
    isPublishable: checklist.isPublishable,
    hasStandardEvaluationTemplate,
    hasEvidenceExport: true,
    hasParticipantReport: true,
    hasReviewerPreview: Boolean(course.reviewerName),
    hasCertificateProofDownloads: completionReport.length === 0 || completionReport.some((row) => row.certificateId),
    hasChangeLog: changeLogs.length > 0,
    hasRemainingCertificateEvidenceGaps: completionReport.some((row) => row.certificateAvailable && row.professionalRegistrationNumber === "Niet vastgelegd"),
  });
  const evidenceExport = buildAccreditationEvidenceExport(course, checklist);
  const participantReportMarkdown = exportParticipantCompletionReportMarkdown(completionReport);
  const participantReportCsv = exportParticipantCompletionReportCsv(completionReport);
  const peOnlineCsv = exportPeOnlinePresenceCsv({
    accreditationActivityId: course.accreditationActivityId ?? "",
    rows: completionReport,
  });
  const dossierDownloadHref = buildDataDownloadHref(evidenceExport, "text/markdown");
  const peOnlinePreviewHref = buildDataDownloadHref(peOnlineCsv, "text/csv");
  const moduleAssessmentCoverage = formatModuleAssessmentCoverage(course);
  const visibilitySummary = summarizeContentVisibility(course);
  const openCriticalItems = checklist.items.filter((item) => item.severity === "critical" && item.status !== "complete");
  const warningItems = checklist.items.filter((item) => item.status === "warning");
  const objectiveBlueprint = objectives.map((objective) => {
    const objectiveModule = modules.find((entry) => entry.id === objective.moduleId);
    const linkedAssessments = assessments.filter((assessment) => assessment.coveredObjectiveIds.includes(objective.id));

    return {
      objective,
      moduleTitle: objectiveModule ? `Module ${objectiveModule.order}: ${objectiveModule.title}` : "Nog niet aan module gekoppeld",
      linkedAssessments,
    };
  });
  const builderSteps = [
    {
      label: "1. Basis",
      description: "Titel, doelgroep, zichtbaarheid, prioriteit en status.",
      complete: Boolean(course.title && course.description && course.audience),
    },
    {
      label: "2. Accreditatiegegevens",
      description: "Register, aanbieder, activiteit-ID, ondertekenaar, auteurs en versiedata.",
      complete: Boolean(course.accreditationRegister && course.accreditationActivityId && course.providerName && course.providerSignatureName && course.versionDate && course.authorExperts.length),
    },
    {
      label: "3. Modules & lessen",
      description: "Modulekaarten met duur, samenvatting, werkvormen en contentblokken.",
      complete: modules.length > 0 && modules.every((module) => module.estimatedMinutes > 0 && module.summary),
    },
    {
      label: "4. Leerdoelenmatrix",
      description: "3–6 leerdoelen met module- en toetsdekking.",
      complete: objectives.length >= 3 && objectives.length <= 6 && objectiveBlueprint.every((entry) => entry.linkedAssessments.length > 0),
    },
    {
      label: "5. Toetsbank",
      description: "Vraagminimum, 70%-norm, max. 3 pogingen en randomisatie.",
      complete: assessments.length > 0 && assessments.every((assessment) => assessment.passPercentage >= 70 && assessment.maxAttempts <= 3 && assessment.shuffleQuestions && assessment.shuffleOptions && assessment.allQuestionsLinkedToObjectives),
    },
    {
      label: "6. Evaluatie",
      description: "Standaard Kwaliteitshuis-evaluatie toegepast.",
      complete: hasStandardEvaluationTemplate,
    },
    {
      label: "7. Reviewer & indienpakket",
      description: "Reviewer-preview, dossier, rapportage en PE-online export.",
      complete: Boolean(course.reviewerName) && dossierPolish.items.every((item) => item.status === "complete"),
    },
  ];

  return (
    <section className="card-surface rounded-[32px] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
            Accreditatie-ready LMS
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Kwaliteitshuis-checklist en reviewer-preview
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
            Deze cockpit toont of de e-learning voldoende metadata, leerdoelen, modules, toetsing,
            evaluatie en bewijsvoering bevat voor accreditatie. In reviewer-modus kan de commissie
            inhoud bekijken zonder echte voortgangsdata te vervuilen.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatusBadge
            label={checklist.isPublishable ? "Publiceerbaar" : `${checklist.criticalOpenCount} blokkades`}
            tone={checklist.isPublishable ? "success" : "warning"}
          />
          <StatusBadge label={mode === "reviewer" ? "Reviewer-preview" : "Beheerweergave"} tone="brand" />
          <StatusBadge label={`${checklist.completedCount}/${checklist.totalCount} checks`} tone="neutral" />
        </div>
      </div>

      {mode === "beheer" ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-white/90 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Admin e-learning builder</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                  Werk de e-learning straks stap voor stap af: basis, accreditatiegegevens, modules, lessen/media,
                  leerdoelen, toetsbank, evaluatie, reviewer-preview en één indienpakket.
                </p>
              </div>
              <StatusBadge
                label={checklist.isPublishable ? "Klaar voor indienpakket" : `${openCriticalItems.length} actiepunt(en)`}
                tone={checklist.isPublishable ? "success" : "warning"}
              />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {builderSteps.map((step) => (
                <div key={step.label} className="rounded-2xl border border-[var(--border)] bg-[var(--brand-soft)]/45 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">{step.label}</p>
                    <StatusBadge label={step.complete ? "gereed" : "aanvullen"} tone={step.complete ? "success" : "neutral"} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-white/90 p-5">
            <h3 className="text-lg font-semibold text-slate-950">Live accreditatiebegeleiding</h3>
            <div className="mt-4 grid gap-2">
              <StatusBadge label={`${checklist.criticalOpenCount} blokkade(s)`} tone={checklist.criticalOpenCount ? "warning" : "success"} />
              <StatusBadge label={`${warningItems.length} waarschuwing(en)`} tone={warningItems.length ? "warning" : "neutral"} />
              <StatusBadge label={`${checklist.completedCount}/${checklist.totalCount} checks groen`} tone="brand" />
            </div>
            <div className="mt-4 space-y-3">
              {openCriticalItems.slice(0, 4).map((item) => (
                <div key={`open-${item.id}`} className="rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                  <p className="font-semibold">{item.label}</p>
                  <p>{item.message}</p>
                </div>
              ))}
              {!openCriticalItems.length ? (
                <div className="rounded-2xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
                  <p className="font-semibold">Geen kritieke blokkades meer.</p>
                  <p>De e-learning is technisch klaar om als accreditatie-ready gepubliceerd te worden.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {mode === "beheer" ? (
        <div className="mt-6 rounded-[28px] border border-[var(--border)] bg-white/85 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Publicatieblokkade</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                Publiceren kan pas als alle kritieke Kwaliteitshuis-checks groen zijn. Waarschuwingen blijven zichtbaar,
                maar blokkeren publicatie niet.
              </p>
            </div>
            <form action={publishCourseAccreditationReadyAction}>
              <input type="hidden" name="courseId" value={course.id} />
              <button
                type="submit"
                disabled={!checklist.isPublishable || course.status === "PUBLISHED"}
                className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {course.status === "PUBLISHED" ? "Al gepubliceerd" : "Publiceer accreditatie-ready"}
              </button>
            </form>
          </div>
          {!checklist.isPublishable ? (
            <p className="mt-3 text-sm font-semibold text-amber-700">
              Nog {checklist.criticalOpenCount} kritieke blokkade(s). Los deze op voordat de e-learning live mag.
            </p>
          ) : null}
        </div>
      ) : null}

      {mode === "beheer" ? (
        <div className="mt-6 rounded-[28px] border border-[var(--border)] bg-white/85 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Sprint 11 inzendcheck</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                Laatste dossier-polish vóór indienen: standaardevaluatie, export, reviewer-preview, certificaatbewijs en wijzigingslog.
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--brand-deep)]">{dossierPolish.summary}</p>
            </div>
            <form action={applyStandardEvaluationTemplateAction}>
              <input type="hidden" name="courseId" value={course.id} />
              <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                Pas standaardevaluatie toe
              </button>
            </form>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {dossierPolish.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                  <StatusBadge label={item.status} tone={getChecklistTone(item.status)} />
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {mode === "beheer" ? (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <form action={saveCourseAccreditationMetadataAction} className="rounded-[28px] bg-[var(--brand-soft)] p-5">
            <input type="hidden" name="courseId" value={course.id} />
            <h3 className="text-lg font-semibold text-slate-950">Stap 1 — Basis & Stap 2 — Accreditatiegegevens</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              Vul hier de harde indienvelden in. Deze gegevens sturen de live checklist, het dossier en de publish-gate.
            </p>
            <div className="mt-4 grid gap-3">
              <input name="title" defaultValue={course.title} placeholder="Titel e-learning" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" required />
              <textarea name="description" defaultValue={course.description} rows={3} placeholder="Beschrijving" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" required />
              <input name="audience" defaultValue={course.audience ?? ""} placeholder="Doelgroepomschrijving voor accreditatie" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
              <div className="grid gap-3 md:grid-cols-2">
                <label className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-900">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">Status</span>
                  <select name="status" defaultValue={course.status} className="w-full bg-transparent text-sm outline-none">
                    <option value="CONCEPT">Concept</option>
                    <option value="REVIEW">Klaar voor review</option>
                    <option value="PUBLISHED" disabled={course.status !== "PUBLISHED"}>Gepubliceerd — via groene checklist</option>
                    <option value="ARCHIVED">Gearchiveerd</option>
                  </select>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-slate-900">
                  <input type="checkbox" name="isMandatory" defaultChecked={course.isMandatory} className="h-4 w-4" />
                  Need to know / verplicht in leerpad
                </label>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">Contentzichtbaarheid</p>
                  <StatusBadge label={visibilitySummary} tone="brand" />
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">
                  Bepaal welke learners deze gepubliceerde e-learning in de Academy zien. Admin/reviewer-preview loopt via de bestaande LMS-paden.
                </p>
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--brand)]/30 bg-[var(--brand-soft)]/55 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-deep)]">Snelkeuze startset</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                    Kies een startset om in één keer de juiste doelgroep te zetten. Laat op handmatig staan als je rollen, doelgroepen of specifieke accounts zelf combineert.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {CONTENT_VISIBILITY_PRESET_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 text-sm text-slate-900">
                        <input type="radio" name="visibilityPreset" value={option.value} defaultChecked={option.value === "MANUAL"} className="h-4 w-4" />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="mt-3 flex items-center gap-3 text-sm font-medium text-slate-900">
                  <input type="checkbox" name="visibleToAll" defaultChecked={course.visibleToAll} className="h-4 w-4" />
                  Zichtbaar voor iedereen
                </label>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">Rollen</p>
                    <div className="mt-2 grid gap-2">
                      {COURSE_VISIBILITY_ROLE_OPTIONS.map((role) => (
                        <label key={role} className="flex items-center gap-2 text-sm text-slate-900">
                          <input type="checkbox" name="visibleToRoles" value={role} defaultChecked={course.visibleToRoles.includes(role)} className="h-4 w-4" />
                          {getRoleLabel(role)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">Doelgroepen</p>
                    <div className="mt-2 grid gap-2">
                      {AUDIENCE_PROFILE_OPTIONS.map((option) => (
                        <label key={option.value} className="flex items-center gap-2 text-sm text-slate-900">
                          <input type="checkbox" name="visibleToAudienceProfiles" value={option.value} defaultChecked={course.visibleToAudienceProfiles.includes(option.value)} className="h-4 w-4" />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <input name="visibleToUserIds" defaultValue={course.visibleToUserIds.join(", ")} placeholder="Specifieke account-id's, komma-gescheiden" className="mt-4 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-900">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">Register</span>
                  <input name="accreditationRegister" defaultValue={course.accreditationRegister ?? ""} placeholder="Bijv. Kwaliteitshuis Fysiotherapie" className="w-full bg-transparent text-sm outline-none" />
                </label>
                <label className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-900">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">Soort scholing</span>
                  <select name="accreditationKind" defaultValue={course.accreditationKind} className="w-full bg-transparent text-sm outline-none">
                    <option value="VAKINHOUDELIJK">Vakinhoudelijk</option>
                    <option value="BEROEPSGERELATEERD">Beroepsgerelateerd</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <input name="providerName" defaultValue={course.providerName ?? ""} placeholder="Aanbieder" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
                <input name="providerSignatureName" defaultValue={course.providerSignatureName ?? ""} placeholder="Ondertekenaar deelnamebewijs" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
                <input name="accreditationActivityId" defaultValue={course.accreditationActivityId ?? ""} placeholder="Activiteit-ID / PE-online ID" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input name="studyLoadMinutes" type="number" defaultValue={course.studyLoadMinutes} placeholder="Studielast in minuten" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" required />
                <input name="requiredQuestionCount" type="number" defaultValue={course.requiredQuestionCount ?? ""} placeholder="Min. MC-vragen" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input name="versionDate" type="date" defaultValue={formatInputDate(course.versionDate)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
                <input name="revisionDueAt" type="date" defaultValue={formatInputDate(course.revisionDueAt)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
              </div>
              <textarea name="authorExperts" defaultValue={formatAuthorExperts(course.authorExperts)} rows={4} placeholder="Naam||Rol||Organisatie||Registratienummer" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm" />
              <input name="changeSummary" defaultValue="Accreditatie-metadata bijgewerkt." className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
              <button type="submit" className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white">Algemene gegevens opslaan</button>
            </div>
          </form>

          <form action={saveCourseAccreditationStructureAction} className="rounded-[28px] bg-[var(--teal-soft)] p-5">
            <input type="hidden" name="courseId" value={course.id} />
            <h3 className="text-lg font-semibold text-slate-950">Leerstructuur beheren</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              Eén regel per item. Modules: volgorde||titel||duur||intro||samenvatting||werkvormen.
            </p>
            <div className="mt-4 grid gap-3">
              <textarea name="modules" defaultValue={formatModules(course)} rows={5} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm" />
              <textarea name="learningObjectives" defaultValue={formatObjectives(course)} rows={5} placeholder="LO1||Tekst leerdoel||modulevolgorde" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm" />
              <textarea name="literature" defaultValue={formatLiterature(course)} rows={4} placeholder="1||Titel||Bron||URL||Richtlijn||Jaar||modulevolgorde" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm" />
              <textarea name="competencies" defaultValue={formatCompetencies(course)} rows={4} placeholder="Naam||Framework||Beschrijving||modulevolgorde" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm" />
              <input name="changeSummary" defaultValue="Accreditatie-structuur bijgewerkt." className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
              <button type="submit" className="rounded-full bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white">Leerstructuur opslaan</button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] bg-white/85 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Register</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{course.accreditationRegister ?? "Nog niet ingevuld"}</p>
        </div>
        <div className="rounded-[24px] bg-white/85 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Soort</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{formatKind(course.accreditationKind)}</p>
        </div>
        <div className="rounded-[24px] bg-white/85 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Versiedatum</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{formatDate(course.versionDate)}</p>
        </div>
        <div className="rounded-[24px] bg-white/85 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Reviewer</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{course.reviewerName ?? "Niet gekoppeld"}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {checklist.items.map((item) => (
          <div key={item.id} className="rounded-[24px] border border-[var(--border)] bg-white/85 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-950">{item.label}</h3>
              <StatusBadge label={item.status} tone={getChecklistTone(item.status)} />
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.message}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[28px] bg-slate-950 p-5 text-white">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Genereer accreditatiedossier</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Genereert één indienpakket voor Kwaliteitshuis: programma per module, studielast, leerdoelen,
              inhoud/werkvormen, toetsplan, leerdoelmatrix, literatuur, competenties, evaluatie, reviewer-instructie,
              certificaatbewijsvelden en wijzigingslog.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={dossierDownloadHref}
              download={`accreditatiedossier-${course.slug}.md`}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Download accreditatiedossier
            </a>
            <StatusBadge label="Copy/paste dossier" tone="neutral" />
          </div>
        </div>
        <textarea
          readOnly
          value={evidenceExport}
          rows={14}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/10 p-4 font-mono text-xs leading-6 text-white outline-none"
        />
      </div>

      <div className="mt-6 rounded-[28px] bg-white/85 p-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Deelnemerrapportage</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              Export voor afrondingsbewijs: deelnemer, registratienummer, e-learning, datum afronding,
              toets-score, pogingen, status, certificaat en evaluatie.
            </p>
          </div>
          <StatusBadge label={`${completionReport.length} deelnemers`} tone="brand" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`/lms/courses/${course.id}/participant-report/csv`}
            className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
          >
            Download CSV
          </a>
          <a
            href={`/lms/courses/${course.id}/participant-report/markdown`}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Download Markdown
          </a>
          <a
            href={`/lms/courses/${course.id}/participant-report/pe-online-csv`}
            className="rounded-full bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white"
          >
            Download PE-online CSV
          </a>
          <a
            href={peOnlinePreviewHref}
            download={`pe-online-preview-${course.slug}.csv`}
            className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Preview PE-online CSV
          </a>
        </div>
        <div className="mt-4 rounded-2xl border border-[var(--teal)]/20 bg-[var(--teal-soft)] p-4">
          <p className="text-sm font-semibold text-slate-950">PE-online aanleverstatus</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            Lever afgeronde deelnemers na certificaatverstrekking bij voorkeur direct aan en uiterlijk <span className="font-semibold text-slate-950">binnen 4 weken</span> via de PE-online CSV-export. De export markeert per deelnemer of BIG/KRF/SKF-nummer, afrondingsdatum, activiteit-id en slagingsstatus compleet zijn.
          </p>
        </div>
        {completionReport.some((row) => row.certificateId) ? (
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--brand-soft)] p-4">
            <p className="text-sm font-semibold text-slate-950">Individuele accreditatiebewijzen</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {completionReport.filter((row) => row.certificateId).map((row) => (
                <a
                  key={row.certificateId}
                  href={row.certificateProofPath}
                  className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[var(--brand-deep)] shadow-sm"
                >
                  {row.participantName} · {row.certificateCode}
                </a>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <textarea
            readOnly
            value={participantReportMarkdown}
            rows={12}
            className="w-full rounded-2xl border border-[var(--border)] bg-white p-4 font-mono text-xs leading-6 text-slate-900 outline-none"
          />
          <textarea
            readOnly
            value={participantReportCsv}
            rows={12}
            className="w-full rounded-2xl border border-[var(--border)] bg-white p-4 font-mono text-xs leading-6 text-slate-900 outline-none"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="rounded-[28px] bg-[var(--brand-soft)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Leerdoelenmatrix</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                Formuleer als: “Na afloop kan de deelnemer…”. Kwaliteitshuis-proof is 3–6 leerdoelen met module- en toetsdekking.
              </p>
            </div>
            <StatusBadge label={`${objectives.length} van 3–6`} tone={objectives.length >= 3 && objectives.length <= 6 ? "success" : "warning"} />
          </div>
          <div className="mt-4 space-y-3">
            {objectiveBlueprint.length ? objectiveBlueprint.map(({ objective, moduleTitle, linkedAssessments }) => (
              <div key={objective.id} className="rounded-2xl bg-white/85 p-4 text-sm leading-6 text-[var(--ink-soft)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p><span className="font-semibold text-[var(--brand-deep)]">{objective.code}</span> — {objective.text}</p>
                  <StatusBadge label={linkedAssessments.length ? "toetsdekking" : "geen toetsdekking"} tone={linkedAssessments.length ? "success" : "warning"} />
                </div>
                <p className="mt-2 text-xs leading-5"><span className="font-semibold text-slate-950">Module:</span> {moduleTitle}</p>
                <p className="text-xs leading-5"><span className="font-semibold text-slate-950">Toets(en):</span> {linkedAssessments.map((assessment) => assessment.title).join(", ") || "Nog niet gekoppeld"}</p>
              </div>
            )) : <p className="text-sm text-[var(--ink-soft)]">Nog geen leerdoelen vastgelegd.</p>}
          </div>
        </div>

        <div className="rounded-[28px] bg-[var(--teal-soft)] p-5">
          <h3 className="text-lg font-semibold text-slate-950">Toetsing en evaluatie</h3>
          {mode === "beheer" ? (
            <form action={saveAssessmentBuilderAction} className="mt-4 rounded-2xl border border-[var(--teal)]/20 bg-white p-4">
              <input type="hidden" name="courseId" value={course.id} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Nieuwe toets/toetsbank toevoegen</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">Koppel bij voorkeur aan een toetsles. Norm staat standaard op 70%, max. 3 pogingen.</p>
                </div>
                <StatusBadge label="Kwaliteitshuis norm" tone="success" />
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.5fr_0.5fr]">
                <input name="assessmentTitle" placeholder="Toetstitel" className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" required />
                <select name="assessmentLessonId" defaultValue="__none" className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm">
                  <option value="__none">Geen toetsles koppelen</option>
                  {lessons.filter((lesson) => lesson.type === "ASSESSMENT").map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                  ))}
                </select>
                <input name="passPercentage" type="number" defaultValue={70} min={1} max={100} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                <input name="maxAttempts" type="number" defaultValue={3} min={1} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_0.4fr]">
                <textarea name="assessmentDescription" placeholder="Korte instructie voor deelnemer/reviewer" rows={2} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                <input name="timeLimitMinutes" type="number" placeholder="Tijdslimiet min. optioneel" className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <label className="flex items-center gap-3 text-sm font-medium text-slate-900"><input type="checkbox" name="shuffleQuestions" defaultChecked className="h-4 w-4" /> Vragen randomiseren</label>
                <label className="flex items-center gap-3 text-sm font-medium text-slate-900"><input type="checkbox" name="shuffleOptions" defaultChecked className="h-4 w-4" /> Antwoorden randomiseren</label>
                <label className="flex items-center gap-3 text-sm font-medium text-slate-900"><input type="checkbox" name="isRequiredForCompletion" defaultChecked className="h-4 w-4" /> Vereist voor certificaat</label>
              </div>
              <button type="submit" className="mt-4 rounded-full bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white">Toets toevoegen</button>
            </form>
          ) : null}
          <div className="mt-4 rounded-2xl border border-[var(--teal)]/20 bg-white/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Toetsblueprint: leerdoelen × modules</p>
              <StatusBadge label={`${assessments.length} toets(en)`} tone="brand" />
            </div>
            <div className="mt-3 grid gap-3">
              {assessments.map((assessment) => {
                const coverage = formatObjectiveCoverage(course, assessment);

                return (
                  <div key={`blueprint-${assessment.id}`} className="rounded-2xl border border-[var(--border)] bg-white p-3 text-xs leading-5 text-[var(--ink-soft)]">
                    <p className="font-semibold text-slate-950">{assessment.title}</p>
                    <p>Gedekte leerdoelen: {coverage.coveredCodes.join(", ") || "geen"}</p>
                    <p>Ongetoetst: {coverage.missingCodes.join(", ") || "geen"}</p>
                    <p>{assessment.questionCount} vragen • {assessment.passPercentage}% norm • max. {assessment.maxAttempts} pogingen</p>
                  </div>
                );
              })}
              {moduleAssessmentCoverage.map(({ module, linkedAssessments }) => (
                <div key={`module-blueprint-${module.id}`} className="rounded-2xl bg-white/70 p-3 text-xs leading-5 text-[var(--ink-soft)]">
                  <span className="font-semibold text-slate-950">Module {module.order}: {module.title}</span> · toetsdekking: {linkedAssessments.map((assessment) => assessment.title).join(", ") || "geen directe toets gekoppeld"}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="rounded-2xl bg-white/85 p-4 text-sm leading-6 text-[var(--ink-soft)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{assessment.title}</p>
                    <p>{assessment.questionCount} vragen • {assessment.passPercentage}% norm • max. {assessment.maxAttempts} pogingen • antwoorden randomiseren: {assessment.shuffleOptions ? "ja" : "nee"}</p>
                    <p className="text-xs leading-5">Gekoppelde toetsles: {getLessonTitle(lessons, assessment.lessonId)}</p>
                  </div>
                  <StatusBadge label={assessment.allQuestionsLinkedToObjectives ? "leerdoeldekking compleet" : "leerdoelen missen"} tone={assessment.allQuestionsLinkedToObjectives ? "success" : "warning"} />
                </div>
                {mode === "beheer" ? (
                  <form action={saveAssessmentBuilderAction} className="mt-4 grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="assessmentId" value={assessment.id} />
                    <div className="grid gap-3 lg:grid-cols-[1fr_0.8fr_0.35fr_0.35fr]">
                      <input name="assessmentTitle" defaultValue={assessment.title} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                      <select name="assessmentLessonId" defaultValue={assessment.lessonId ?? "__none"} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm">
                        <option value="__none">Geen toetsles koppelen</option>
                        {lessons.filter((lesson) => lesson.type === "ASSESSMENT").map((lesson) => (
                          <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                        ))}
                      </select>
                      <input name="passPercentage" type="number" min={1} max={100} defaultValue={assessment.passPercentage} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                      <input name="maxAttempts" type="number" min={1} defaultValue={assessment.maxAttempts} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                    </div>
                    <div className="grid gap-3 lg:grid-cols-[1fr_0.35fr]">
                      <textarea name="assessmentDescription" defaultValue={assessment.description ?? ""} rows={2} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                      <input name="timeLimitMinutes" type="number" defaultValue={assessment.timeLimitMinutes ?? ""} placeholder="Tijdslimiet" className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      <label className="flex items-center gap-3 text-sm font-medium text-slate-900"><input type="checkbox" name="shuffleQuestions" defaultChecked={assessment.shuffleQuestions} className="h-4 w-4" /> Vragen randomiseren</label>
                      <label className="flex items-center gap-3 text-sm font-medium text-slate-900"><input type="checkbox" name="shuffleOptions" defaultChecked={assessment.shuffleOptions} className="h-4 w-4" /> Antwoorden randomiseren</label>
                      <label className="flex items-center gap-3 text-sm font-medium text-slate-900"><input type="checkbox" name="isRequiredForCompletion" defaultChecked={assessment.isRequiredForCompletion} className="h-4 w-4" /> Vereist voor certificaat</label>
                    </div>
                    <button type="submit" className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white">Toets opslaan</button>
                  </form>
                ) : null}
                <div className="mt-4 space-y-3">
                  {assessment.questions.map((question) => (
                    <div key={question.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">Vraag {question.order}: {question.prompt}</p>
                          <p className="text-xs leading-5">{formatQuestionType(question.type)} • {question.points} punt(en) • leerdoelen: {formatAssessmentObjectiveCodes(objectives, question.objectiveIds) || "niet gekoppeld"}</p>
                          {question.explanation ? <p className="mt-1 text-xs leading-5">Feedback/uitleg: {question.explanation}</p> : null}
                        </div>
                        <StatusBadge label={question.objectiveIds.length ? "gekoppeld" : "mist leerdoel"} tone={question.objectiveIds.length ? "success" : "warning"} />
                      </div>
                      {question.options.length ? (
                        <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs leading-5">
                          {question.options.map((option) => (
                            <li key={option.id} className={option.isCorrect ? "font-semibold text-[var(--brand-deep)]" : ""}>{option.label}{option.isCorrect ? " ✓" : ""}</li>
                          ))}
                        </ol>
                      ) : null}
                      {mode === "beheer" ? (
                        <div className="mt-4 grid gap-3">
                          <form action={saveAssessmentQuestionAction} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--brand-soft)] p-4">
                            <input type="hidden" name="courseId" value={course.id} />
                            <input type="hidden" name="assessmentId" value={assessment.id} />
                            <input type="hidden" name="questionId" value={question.id} />
                            <div className="grid gap-3 lg:grid-cols-[1fr_0.5fr_0.25fr_0.25fr]">
                              <input name="questionPrompt" defaultValue={question.prompt} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                              <select name="questionType" defaultValue={question.type} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm">
                                <option value="MULTIPLE_CHOICE">Single choice</option>
                                <option value="MULTIPLE_RESPONSE">Multiple response</option>
                                <option value="TRUE_FALSE">Waar/onwaar</option>
                                <option value="OPEN_TEXT">Open tekst</option>
                              </select>
                              <input name="questionOrder" type="number" min={1} defaultValue={question.order} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                              <input name="questionPoints" type="number" min={1} defaultValue={question.points} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                            </div>
                            <textarea name="questionExplanation" defaultValue={question.explanation ?? ""} rows={2} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                            <textarea name="questionOptions" defaultValue={formatQuestionOptionsForInput(question.options)} rows={3} className="rounded-2xl border border-[var(--border)] px-4 py-3 font-mono text-xs" />
                            <div className="grid gap-2 md:grid-cols-2">
                              {objectives.map((objective) => (
                                <label key={objective.id} className="flex items-center gap-2 text-xs text-slate-900">
                                  <input type="checkbox" name="objectiveIds" value={objective.id} defaultChecked={question.objectiveIds.includes(objective.id)} />
                                  {objective.code} — {objective.text}
                                </label>
                              ))}
                            </div>
                            <button type="submit" className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white">Vraag opslaan</button>
                          </form>
                          <form action={deleteAssessmentQuestionAction}>
                            <input type="hidden" name="courseId" value={course.id} />
                            <input type="hidden" name="assessmentId" value={assessment.id} />
                            <input type="hidden" name="questionId" value={question.id} />
                            <button type="submit" className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">Vraag verwijderen</button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {mode === "beheer" ? (
                    <form action={saveAssessmentQuestionAction} className="grid gap-3 rounded-2xl border border-dashed border-[var(--teal)] bg-white p-4">
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="assessmentId" value={assessment.id} />
                      <p className="text-sm font-semibold text-slate-950">Nieuwe toetsvraag toevoegen</p>
                      <div className="grid gap-3 lg:grid-cols-[1fr_0.5fr_0.25fr_0.25fr]">
                        <input name="questionPrompt" placeholder="Vraagtekst" className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" required />
                        <select name="questionType" defaultValue="MULTIPLE_CHOICE" className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm">
                          <option value="MULTIPLE_CHOICE">Single choice</option>
                          <option value="MULTIPLE_RESPONSE">Multiple response</option>
                          <option value="TRUE_FALSE">Waar/onwaar</option>
                          <option value="OPEN_TEXT">Open tekst</option>
                        </select>
                        <input name="questionOrder" type="number" min={1} defaultValue={assessment.questions.length + 1} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                        <input name="questionPoints" type="number" min={1} defaultValue={1} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                      </div>
                      <textarea name="questionExplanation" placeholder="Feedback/uitleg na beantwoorden" rows={2} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                      <textarea name="questionOptions" placeholder="Antwoord A||true&#10;Antwoord B||false&#10;Antwoord C||false" rows={3} className="rounded-2xl border border-[var(--border)] px-4 py-3 font-mono text-xs" />
                      <div className="grid gap-2 md:grid-cols-2">
                        {objectives.map((objective) => (
                          <label key={objective.id} className="flex items-center gap-2 text-xs text-slate-900">
                            <input type="checkbox" name="objectiveIds" value={objective.id} />
                            {objective.code} — {objective.text}
                          </label>
                        ))}
                      </div>
                      <button type="submit" className="rounded-full bg-[var(--teal)] px-4 py-2 text-xs font-semibold text-white">Vraag toevoegen</button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
            {evaluationForms.map((form) => (
              <div key={form.id} className="rounded-2xl bg-white/85 p-4 text-sm leading-6 text-[var(--ink-soft)]">
                <p className="font-semibold text-slate-950">{form.title}</p>
                <p>{form.questionCount} evaluatievragen • verplicht: {form.isRequired ? "ja" : "nee"}</p>
                {form.questions.length ? (
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs leading-5 text-[var(--ink-soft)]">
                    {form.questions.map((question) => (
                      <li key={question.id}>{question.label}</li>
                    ))}
                  </ol>
                ) : null}
              </div>
            ))}
            {!assessments.length && !evaluationForms.length ? <p className="text-sm text-[var(--ink-soft)]">Nog geen toets/evaluatie vastgelegd.</p> : null}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] bg-white/85 p-5">
        <h3 className="text-lg font-semibold text-slate-950">Versiebeheer en wijzigingslog</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
          Actieve versie: {course.activeVersion?.versionNumber ?? "geen"}. {course.activeVersion?.changeSummary ?? "Nog geen wijzigingssamenvatting."}
        </p>
        <div className="mt-4 space-y-3">
          {changeLogs.length ? changeLogs.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-[var(--border)] p-4 text-sm leading-6 text-[var(--ink-soft)]">
              <p className="font-semibold text-slate-950">{entry.changeType} • {formatDate(entry.changedAt)}</p>
              <p>{entry.summary}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">Door {entry.changedByName}</p>
            </div>
          )) : <p className="text-sm text-[var(--ink-soft)]">Nog geen wijzigingslog vastgelegd.</p>}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Modules, lessen en contentblokken</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              Beheer hier de echte bouwblokken van de e-learning. Dit vervangt stap voor stap de technische regelinvoer hierboven.
            </p>
          </div>
          <StatusBadge label={`${modules.length} module${modules.length === 1 ? "" : "s"}`} tone="brand" />
        </div>
        {mode === "beheer" ? (
          <form action={saveCourseBuilderModuleAction} className="rounded-[28px] border border-[var(--border)] bg-[var(--brand-soft)] p-5">
            <input type="hidden" name="courseId" value={course.id} />
            <h4 className="text-base font-semibold text-slate-950">Nieuwe module toevoegen</h4>
            <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.5fr_1fr]">
              <input name="moduleTitle" placeholder="Moduletitel" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" required />
              <input name="moduleEstimatedMinutes" type="number" placeholder="Minuten" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" required />
              <input name="moduleWorkForms" placeholder="video, tekst, casus" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <textarea name="moduleIntroduction" placeholder="Korte introductie" rows={3} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
              <textarea name="moduleSummary" placeholder="Samenvatting / leeropbrengst" rows={3} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
            </div>
            <button type="submit" className="mt-4 rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white">Module toevoegen</button>
          </form>
        ) : null}
        {modules.length ? modules.map((module) => {
          const moduleObjectives = objectives.filter((objective) => objective.moduleId === module.id);
          const moduleLiterature = literature.filter((reference) => reference.moduleId === module.id);
          const moduleCompetencies = competencies.filter((reference) => reference.moduleId === module.id);
          const moduleLessons = lessons.filter((lesson) => lesson.moduleId === module.id);

          return (
            <div key={module.id} className="rounded-[28px] border border-[var(--border)] bg-white/85 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge label={`Module ${module.order}`} tone="brand" />
                <StatusBadge label={`${module.estimatedMinutes} minuten`} tone="neutral" />
                <StatusBadge label={`${moduleLessons.length} les/contentblok${moduleLessons.length === 1 ? "" : "ken"}`} tone={moduleLessons.length ? "success" : "warning"} />
                {module.workForms.map((workForm) => (
                  <StatusBadge key={workForm} label={formatWorkForm(workForm)} tone="neutral" />
                ))}
              </div>
              <h4 className="mt-4 text-lg font-semibold text-slate-950">{module.title}</h4>
              {module.introduction ? <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{module.introduction}</p> : null}
              {module.summary ? <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]"><span className="font-semibold">Samenvatting:</span> {module.summary}</p> : null}
              <div className="mt-4 grid gap-3 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Leerdoelen</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{moduleObjectives.map((entry) => entry.code).join(", ") || "Geen"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Lessen/content</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{moduleLessons.map((entry) => entry.title).join(", ") || "Geen"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Literatuur</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{moduleLiterature.map((entry) => entry.title).join(", ") || "Geen"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Competenties</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{moduleCompetencies.map((entry) => entry.name).join(", ") || "Geen"}</p>
                </div>
              </div>
              {mode === "beheer" ? (
                <div className="mt-5 space-y-4 rounded-2xl border border-[var(--border)] bg-slate-50 p-4">
                  <form action={saveCourseBuilderModuleAction} className="grid gap-3">
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="moduleId" value={module.id} />
                    <div className="grid gap-3 lg:grid-cols-[1.2fr_0.5fr_1fr]">
                      <input name="moduleTitle" defaultValue={module.title} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" required />
                      <input name="moduleEstimatedMinutes" type="number" defaultValue={module.estimatedMinutes} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" required />
                      <input name="moduleWorkForms" defaultValue={module.workForms.join(", ").toLowerCase()} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <textarea name="moduleIntroduction" defaultValue={module.introduction ?? ""} rows={3} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
                      <textarea name="moduleSummary" defaultValue={module.summary ?? ""} rows={3} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="submit" className="rounded-full bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white">Module opslaan</button>
                      <a href={`/lms/courses/${course.id}`} className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Bekijk als deelnemer</a>
                    </div>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    <form action={duplicateCourseBuilderModuleAction}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="moduleId" value={module.id} />
                      <button type="submit" className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-slate-700">Dupliceren</button>
                    </form>
                    <form action={moveCourseBuilderModuleAction}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="moduleId" value={module.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button type="submit" className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-slate-700">Omhoog</button>
                    </form>
                    <form action={moveCourseBuilderModuleAction}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="moduleId" value={module.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button type="submit" className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-slate-700">Omlaag</button>
                    </form>
                    <form action={deleteCourseBuilderModuleAction}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="moduleId" value={module.id} />
                      <button type="submit" className="rounded-full border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700">Verwijderen</button>
                    </form>
                  </div>
                  {moduleLessons.length ? (
                    <div className="space-y-2 rounded-2xl bg-white p-4">
                      <h5 className="text-sm font-semibold text-slate-950">Bestaande lessen/contentblokken</h5>
                      {moduleLessons.map((lesson) => (
                        <form key={`edit-${lesson.id}`} action={saveCourseBuilderLessonAction} className="grid gap-2 rounded-2xl border border-[var(--border)] p-3">
                          <input type="hidden" name="courseId" value={course.id} />
                          <input type="hidden" name="moduleId" value={module.id} />
                          <input type="hidden" name="lessonId" value={lesson.id} />
                          <div className="grid gap-2 lg:grid-cols-[1.2fr_0.7fr_0.5fr_0.5fr]">
                            <input name="lessonTitle" defaultValue={lesson.title} className="rounded-2xl border border-[var(--border)] px-3 py-2 text-xs" required />
                            <select name="lessonType" defaultValue={lesson.type} className="rounded-2xl border border-[var(--border)] px-3 py-2 text-xs">
                              <option value="TEXT">Tekst</option>
                              <option value="VIDEO">Video</option>
                              <option value="DOCUMENT">Document</option>
                              <option value="CASE">Casus</option>
                              <option value="REFLECTION">Reflectie</option>
                              <option value="ASSESSMENT">Toets</option>
                            </select>
                            <input name="lessonOrder" type="number" defaultValue={lesson.order} className="rounded-2xl border border-[var(--border)] px-3 py-2 text-xs" required />
                            <input name="lessonEstimatedMinutes" type="number" defaultValue={lesson.estimatedMinutes} className="rounded-2xl border border-[var(--border)] px-3 py-2 text-xs" required />
                          </div>
                          <div className="flex flex-wrap gap-2 text-[0.7rem] font-semibold text-slate-700">
                            <span className="rounded-full bg-[var(--sand)] px-3 py-1">Media: {formatLessonMediaSummary(lesson.content)}</span>
                          </div>
                          <input name="lessonDescription" defaultValue={lesson.description ?? ""} placeholder="Omschrijving" className="rounded-2xl border border-[var(--border)] px-3 py-2 text-xs" />
                          <div className="grid gap-2 lg:grid-cols-[0.8fr_1.2fr]">
                            <input name="lessonMediaLabel" placeholder="Mediatitel, bv. Video module 1" className="rounded-2xl border border-[var(--border)] px-3 py-2 text-xs" />
                            <input name="lessonMediaUrl" placeholder="https://... of /lms/... mp4/pdf/png" className="rounded-2xl border border-[var(--border)] px-3 py-2 text-xs" />
                          </div>
                          <p className="text-[0.68rem] leading-5 text-[var(--ink-soft)]">Nieuwe mediabron wordt netjes aan de lesinhoud toegevoegd en in de les als video, afbeelding of documentkaart getoond.</p>
                          <textarea name="lessonContent" defaultValue={lesson.content ?? ""} rows={3} placeholder="Lesinhoud. Ruwe mediaregels worden straks als nette blokken weergegeven." className="rounded-2xl border border-[var(--border)] px-3 py-2 text-xs" required />
                          <label className="flex items-center gap-2 text-xs font-medium text-slate-900">
                            <input type="checkbox" name="lessonIsRequired" defaultChecked={lesson.isRequired} className="h-4 w-4" />
                            Telt mee voor afronding/studielast
                          </label>
                          <button type="submit" className="w-fit rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Les opslaan</button>
                        </form>
                      ))}
                    </div>
                  ) : null}
                  <form action={saveCourseBuilderLessonAction} className="grid gap-3 rounded-2xl bg-white p-4">
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="moduleId" value={module.id} />
                    <h5 className="text-sm font-semibold text-slate-950">Les/contentblok toevoegen aan deze module</h5>
                    <div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.5fr_0.5fr]">
                      <input name="lessonTitle" placeholder="Titel les/contentblok" className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" required />
                      <select name="lessonType" defaultValue="TEXT" className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm">
                        <option value="TEXT">Tekst</option>
                        <option value="VIDEO">Video</option>
                        <option value="DOCUMENT">Document</option>
                        <option value="CASE">Casus</option>
                        <option value="REFLECTION">Reflectie</option>
                        <option value="ASSESSMENT">Toets</option>
                      </select>
                      <input name="lessonOrder" type="number" defaultValue={lessons.length + 1} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" required />
                      <input name="lessonEstimatedMinutes" type="number" placeholder="Min." className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" required />
                    </div>
                    <input name="lessonDescription" placeholder="Korte omschrijving" className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                    <div className="grid gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--sage-soft)]/40 p-3 lg:grid-cols-[0.75fr_1.25fr]">
                      <input name="lessonMediaLabel" placeholder="Mediatitel, bv. Video module 1" className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                      <input name="lessonMediaUrl" placeholder="Media/document URL: https://... of /lms/... mp4/pdf/png" className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                      <p className="lg:col-span-2 text-xs leading-5 text-[var(--ink-soft)]">Voor nu registreer je een bestaande videolink/documentlink. De deelnemer ziet daarna een nette videospeler, afbeelding of documentkaart in plaats van een ruwe URL.</p>
                    </div>
                    <textarea name="lessonContent" rows={4} placeholder="Tekst of instructie. Voeg hierboven eventueel één mediabron toe." className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" required />
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <input type="checkbox" name="lessonIsRequired" defaultChecked className="h-4 w-4" />
                      Telt mee voor afronding/studielast
                    </label>
                    <button type="submit" className="rounded-full bg-[var(--teal)] px-4 py-2 text-xs font-semibold text-white">Les toevoegen</button>
                  </form>
                </div>
              ) : null}
            </div>
          );
        }) : <p className="text-sm text-[var(--ink-soft)]">Nog geen modules vastgelegd.</p>}
      </div>
    </section>
  );
}
