import type {
  LearningGoalStatus,
  ModuleStatus,
  OnboardingProgress,
  OnboardingStep,
  User,
} from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date?: string) {
  if (!date) {
    return "Nog niet gepland";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getOnboardingCompletion(
  steps: OnboardingStep[],
  progress: OnboardingProgress[],
) {
  if (!steps.length) {
    return 0;
  }

  const completed = steps.filter((step) =>
    progress.some((entry) => entry.stepId === step.id && entry.completed),
  ).length;

  return Math.round((completed / steps.length) * 100);
}

export function getStatusTone(
  status: ModuleStatus | LearningGoalStatus,
): "brand" | "warning" | "success" {
  if (status === "AFGEROND") {
    return "success";
  }

  if (status === "BEZIG") {
    return "warning";
  }

  return "brand";
}

export function getTeamMetricLabel(user: User) {
  return user.isOnboarding ? "Onboarding actief" : "Actief teamlid";
}
