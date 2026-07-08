export const REQUIRED_LITERATURE_STEP_KEY = "required-literature-read";

export type RequiredLiteratureProgressLesson = {
  id: string;
  type: string;
  order?: number;
};

export type RequiredLiteratureReference = {
  guideline?: string | null;
};

export function isRequiredLiteratureReference(reference: RequiredLiteratureReference) {
  return reference.guideline?.toLowerCase().includes("verplichte") ?? false;
}

export function getRequiredLiteratureStepKey(moduleNumber: string | null) {
  return moduleNumber ? `module-${moduleNumber}-literatuur` : REQUIRED_LITERATURE_STEP_KEY;
}

export function getRequiredLiteratureProgressLesson<T extends RequiredLiteratureProgressLesson>(lessons: T[]) {
  return lessons.find((lesson) => lesson.type === "DOCUMENT") ?? lessons[0] ?? null;
}
