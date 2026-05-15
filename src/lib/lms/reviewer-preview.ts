import type { Role } from "@/lib/types";
import { canUsePersonalLms } from "@/lib/roles";

export type ReviewerPreviewMode = "learner" | "teamleider" | "beheer" | "reviewer";

export type ReviewerPreviewState = {
  mode: ReviewerPreviewMode;
  isPreview: boolean;
  canViewWithoutEnrollment: boolean;
  canMutateProgress: boolean;
  label: "LEARNER" | "TEAMLEIDER" | "BEHEER_PREVIEW" | "REVIEWER_PREVIEW";
};

export type ReviewerPreviewCourseInput = {
  id: string;
  title: string;
  status: string;
  studyLoadMinutes: number;
  accreditationRegister: string | null;
  accreditationActivityId: string | null;
  providerName: string | null;
  providerSignatureName: string | null;
  requiredQuestionCount: number | null;
  versionCount: number;
  enrollmentCount: number;
};

export type ReviewerPreviewCourseItem = ReviewerPreviewCourseInput & {
  previewPath: string;
  displayAccreditationRegister: string;
  evidenceComplete: boolean;
  evidenceMissingLabels: string[];
  reviewerChecklist: string[];
  canFreelyNavigate: boolean;
};

export type ReviewerCoursePreviewSummary = {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalStudyLoadMinutes: number;
  evidenceCompleteCourses: number;
  evidenceIncompleteCourses: number;
  items: ReviewerPreviewCourseItem[];
};

export function canMutateLearnerProgress(role: Role, hasEnrollment: boolean) {
  return hasEnrollment && canUsePersonalLms(role);
}

export function getReviewerPreviewMode(role: Role, hasEnrollment: boolean): ReviewerPreviewState {
  if (role === "REVIEWER") {
    return {
      mode: "reviewer",
      isPreview: true,
      canViewWithoutEnrollment: true,
      canMutateProgress: false,
      label: "REVIEWER_PREVIEW",
    };
  }

  if (role === "BEHEERDER") {
    return {
      mode: "beheer",
      isPreview: true,
      canViewWithoutEnrollment: true,
      canMutateProgress: false,
      label: "BEHEER_PREVIEW",
    };
  }

  if (role === "TEAMLEIDER") {
    return {
      mode: "teamleider",
      isPreview: false,
      canViewWithoutEnrollment: false,
      canMutateProgress: canMutateLearnerProgress(role, hasEnrollment),
      label: "TEAMLEIDER",
    };
  }

  return {
    mode: "learner",
    isPreview: false,
    canViewWithoutEnrollment: false,
    canMutateProgress: canMutateLearnerProgress(role, hasEnrollment),
    label: "LEARNER",
  };
}

function missingEvidenceLabels(course: ReviewerPreviewCourseInput): string[] {
  const checks: Array<[string, string | null]> = [
    ["register", course.accreditationRegister],
    ["activiteit-ID", course.accreditationActivityId],
    ["aanbieder", course.providerName],
    ["ondertekenaar", course.providerSignatureName],
    ["studielast", course.studyLoadMinutes > 0 ? String(course.studyLoadMinutes) : null],
    ["vraagminimum", course.requiredQuestionCount ? String(course.requiredQuestionCount) : null],
  ];

  return checks
    .filter(([, value]) => !String(value ?? "").trim())
    .map(([label]) => label);
}

export function buildReviewerCoursePreviewSummary(
  courses: ReviewerPreviewCourseInput[]
): ReviewerCoursePreviewSummary {
  const items = courses.map((course) => {
    const evidenceMissingLabels = missingEvidenceLabels(course);

    return {
      ...course,
      previewPath: `/lms/courses/${course.id}`,
      displayAccreditationRegister: course.accreditationRegister?.trim() || "Niet vastgelegd",
      evidenceComplete: evidenceMissingLabels.length === 0,
      evidenceMissingLabels,
      canFreelyNavigate: true,
      reviewerChecklist: [
        "Vrije navigatie door modules en lessen zonder inschrijving",
        "Toetsinstellingen en vraagenaantal zichtbaar zonder poging aan te maken",
        "Accreditatiedossier, evaluatie en deelnemerrapportage read-only beschikbaar",
        "Geen voortgang, evaluatie, toetspoging of certificaatmutatie in previewmodus",
      ],
    };
  });

  return {
    totalCourses: courses.length,
    publishedCourses: courses.filter((course) => course.status === "PUBLISHED").length,
    draftCourses: courses.filter((course) => course.status !== "PUBLISHED").length,
    totalStudyLoadMinutes: courses.reduce((total, course) => total + course.studyLoadMinutes, 0),
    evidenceCompleteCourses: items.filter((course) => course.evidenceComplete).length,
    evidenceIncompleteCourses: items.filter((course) => !course.evidenceComplete).length,
    items,
  };
}
