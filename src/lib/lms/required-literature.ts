export const REQUIRED_LITERATURE_STEP_KEY = "required-literature-read";

export type RequiredLiteratureProgressLesson = {
  id: string;
  type: string;
  order?: number;
};

export function getRequiredLiteratureProgressLesson<T extends RequiredLiteratureProgressLesson>(lessons: T[]) {
  return lessons.find((lesson) => lesson.type === "DOCUMENT") ?? lessons[0] ?? null;
}
