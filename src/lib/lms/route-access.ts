import type { Role } from "@/lib/types";

type LearnerLmsRedirectOptions = {
  courseSlug?: string | null;
  lessonSlug?: string | null;
};

const PERSONAL_LMS_ROUTE_ROLES = ["MEDEWERKER", "TEAMLEIDER", "PRAKTIJKHOUDER"] as const satisfies Role[];
const LMS_COCKPIT_ROLES = ["BEHEERDER", "REVIEWER"] as const satisfies Role[];

function hasPersonalLmsRoute(role: Role) {
  return PERSONAL_LMS_ROUTE_ROLES.includes(role as (typeof PERSONAL_LMS_ROUTE_ROLES)[number]);
}

function hasLmsCockpitRoute(role: Role) {
  return LMS_COCKPIT_ROLES.includes(role as (typeof LMS_COCKPIT_ROLES)[number]);
}

export function getLearnerLmsRedirectPath(
  role: Role,
  options: LearnerLmsRedirectOptions = {},
) {
  if (!hasPersonalLmsRoute(role)) {
    return hasLmsCockpitRoute(role) ? null : "/";
  }

  if (options.courseSlug && options.lessonSlug) {
    return `/academy/${options.courseSlug}/lessons/${options.lessonSlug}`;
  }

  if (options.courseSlug) {
    return `/academy/${options.courseSlug}`;
  }

  return "/academy";
}
