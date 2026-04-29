import type { Role } from "@/lib/types";

type LearnerLmsRedirectOptions = {
  courseSlug?: string | null;
  lessonSlug?: string | null;
};

export function getLearnerLmsRedirectPath(
  role: Role,
  options: LearnerLmsRedirectOptions = {},
) {
  if (role !== "MEDEWERKER") {
    return null;
  }

  if (options.courseSlug && options.lessonSlug) {
    return `/academy/${options.courseSlug}/lessons/${options.lessonSlug}`;
  }

  if (options.courseSlug) {
    return `/academy/${options.courseSlug}`;
  }

  return "/academy";
}
