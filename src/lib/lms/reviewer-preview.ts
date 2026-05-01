import type { Role } from "@/lib/types";

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
  versionCount: number;
  enrollmentCount: number;
};

export type ReviewerPreviewCourseItem = ReviewerPreviewCourseInput & {
  previewPath: string;
  displayAccreditationRegister: string;
};

export type ReviewerCoursePreviewSummary = {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalStudyLoadMinutes: number;
  items: ReviewerPreviewCourseItem[];
};

export function canMutateLearnerProgress(role: Role, hasEnrollment: boolean) {
  return hasEnrollment && role !== "REVIEWER" && role !== "BEHEERDER";
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

export function buildReviewerCoursePreviewSummary(
  courses: ReviewerPreviewCourseInput[]
): ReviewerCoursePreviewSummary {
  const items = courses.map((course) => ({
    ...course,
    previewPath: `/lms/courses/${course.id}`,
    displayAccreditationRegister: course.accreditationRegister?.trim() || "Niet vastgelegd",
  }));

  return {
    totalCourses: courses.length,
    publishedCourses: courses.filter((course) => course.status === "PUBLISHED").length,
    draftCourses: courses.filter((course) => course.status !== "PUBLISHED").length,
    totalStudyLoadMinutes: courses.reduce((total, course) => total + course.studyLoadMinutes, 0),
    items,
  };
}
