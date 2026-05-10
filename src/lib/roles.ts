import type { Role } from "@/lib/types";

export const PERSONAL_LMS_ROLES = ["MEDEWERKER", "TEAMLEIDER", "PRAKTIJKHOUDER"] as const satisfies Role[];
export const PERSONAL_DEVELOPMENT_ROLES = ["MEDEWERKER", "TEAMLEIDER"] as const satisfies Role[];
export const TEAM_MONITOR_ROLES = ["TEAMLEIDER"] as const satisfies Role[];
export const PRACTICE_MONITOR_ROLES = ["PRAKTIJKMANAGER", "PRAKTIJKHOUDER", "BEHEERDER"] as const satisfies Role[];
export const ACADEMY_MANAGEMENT_ROLES = ["BEHEERDER"] as const satisfies Role[];
export const ACCREDITATION_REVIEW_ROLES = ["REVIEWER", "BEHEERDER"] as const satisfies Role[];

export type NavigationItem = {
  href: string;
  label: string;
};

export function canUsePersonalLms(role: Role) {
  return PERSONAL_LMS_ROLES.includes(role as (typeof PERSONAL_LMS_ROLES)[number]);
}

export function canUsePersonalDevelopment(role: Role) {
  return PERSONAL_DEVELOPMENT_ROLES.includes(role as (typeof PERSONAL_DEVELOPMENT_ROLES)[number]);
}

export function canMonitorOwnTeam(role: Role) {
  return TEAM_MONITOR_ROLES.includes(role as (typeof TEAM_MONITOR_ROLES)[number]);
}

export function canMonitorPractice(role: Role) {
  return PRACTICE_MONITOR_ROLES.includes(role as (typeof PRACTICE_MONITOR_ROLES)[number]);
}

export function canManageAcademy(role: Role) {
  return ACADEMY_MANAGEMENT_ROLES.includes(role as (typeof ACADEMY_MANAGEMENT_ROLES)[number]);
}

export function canReviewAccreditation(role: Role) {
  return ACCREDITATION_REVIEW_ROLES.includes(role as (typeof ACCREDITATION_REVIEW_ROLES)[number]);
}

export function canOpenTeamRoutes(role: Role) {
  return canMonitorOwnTeam(role) || canMonitorPractice(role);
}

export function isPracticeWideMonitor(role: Role) {
  return canMonitorPractice(role);
}

export function getRoleLabel(role: Role) {
  const labels: Record<Role, string> = {
    MEDEWERKER: "Medewerker",
    TEAMLEIDER: "Teamleider",
    PRAKTIJKMANAGER: "Praktijkmanager",
    PRAKTIJKHOUDER: "Praktijkhouder",
    BEHEERDER: "Beheerder",
    REVIEWER: "Reviewer",
  };

  return labels[role];
}

export function getDashboardLabel(role: Role) {
  if (role === "PRAKTIJKHOUDER") {
    return "Praktijkdashboard";
  }

  if (role === "PRAKTIJKMANAGER") {
    return "Praktijkmonitor";
  }

  if (role === "BEHEERDER") {
    return "Cockpit";
  }

  return "Dashboard";
}

export function getNavigationItems(role: Role, isOnboarding = false): NavigationItem[] {
  const items: NavigationItem[] = [{ href: "/", label: getDashboardLabel(role) }];

  if (canUsePersonalLms(role)) {
    items.push({ href: "/academy", label: "Fy-fit Academy" });
    items.push({ href: "/academy/certificates", label: "Certificaten" });
  } else if (canManageAcademy(role) || canReviewAccreditation(role)) {
    items.push({ href: "/lms", label: canReviewAccreditation(role) && !canManageAcademy(role) ? "Accreditatie-preview" : "LMS cockpit" });
  }

  if (canUsePersonalDevelopment(role)) {
    items.push({ href: "/ontwikkeling", label: "Mijn ontwikkeling" });
  }

  if (isOnboarding && canUsePersonalDevelopment(role)) {
    items.push({ href: "/onboarding", label: "Onboarding" });
  }

  if (role === "PRAKTIJKMANAGER") {
    items.push({ href: "/praktijkbeheer", label: "Praktijkbeheer" });
  }

  items.push({ href: "/bibliotheek", label: "Praktijkbibliotheek" });

  if (canOpenTeamRoutes(role)) {
    items.push({ href: "/team", label: canMonitorPractice(role) ? "Praktijkmonitor" : "Team" });
  }

  if (canManageAcademy(role)) {
    items.push({ href: "/academybeheer", label: "Academybeheer" });
    items.push({ href: "/admin", label: "Admin" });
  }

  return items;
}