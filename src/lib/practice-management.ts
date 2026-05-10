import type { LearningGoal, LibraryDocument, Role, User } from "@/lib/types";

export type PracticeManagementMetric = {
  label: string;
  value: number;
  detail: string;
};

export type PracticeManagementWorkflowKey =
  | "announcements"
  | "deadlines"
  | "conversations"
  | "reports"
  | "library";

export type PracticeManagementWorkflow = {
  key: PracticeManagementWorkflowKey;
  title: string;
  description: string;
  href: string;
  cta: string;
  status: string;
};

export type PracticeManagementOverview = {
  metrics: {
    activeTeamMembers: number;
    onboardingMembers: number;
    openDevelopmentGoals: number;
    publishedDocuments: number;
  };
  metricCards: PracticeManagementMetric[];
  workflows: PracticeManagementWorkflow[];
  exportLinks: Array<{
    label: string;
    href: string;
    description: string;
  }>;
};

const PRACTICE_MANAGEMENT_ROLES = ["PRAKTIJKMANAGER", "PRAKTIJKHOUDER", "BEHEERDER"] as const satisfies Role[];

export function canAccessPracticeManagement(role: Role) {
  return PRACTICE_MANAGEMENT_ROLES.includes(role as (typeof PRACTICE_MANAGEMENT_ROLES)[number]);
}

export function buildPracticeManagementOverview(input: {
  users: User[];
  goals: LearningGoal[];
  documents: LibraryDocument[];
}): PracticeManagementOverview {
  const managedUsers = input.users.filter(
    (user) => user.isActive && user.role !== "BEHEERDER" && user.role !== "REVIEWER",
  );
  const openDevelopmentGoals = input.goals.filter((goal) => goal.status !== "AFGEROND").length;
  const publishedDocuments = input.documents.filter((document) => document.isPublished).length;

  const metrics = {
    activeTeamMembers: managedUsers.length,
    onboardingMembers: managedUsers.filter((user) => user.isOnboarding).length,
    openDevelopmentGoals,
    publishedDocuments,
  };

  return {
    metrics,
    metricCards: [
      {
        label: "Actieve medewerkers",
        value: metrics.activeTeamMembers,
        detail: "Exclusief beheer- en revieweraccounts.",
      },
      {
        label: "Onboarding loopt",
        value: metrics.onboardingMembers,
        detail: "Medewerkers die begeleiding of startchecks nodig hebben.",
      },
      {
        label: "Open ontwikkeldoelen",
        value: metrics.openDevelopmentGoals,
        detail: "Open of lopende doelen die opvolging vragen.",
      },
      {
        label: "Gepubliceerde documenten",
        value: metrics.publishedDocuments,
        detail: "Actuele items in de praktijkbibliotheek.",
      },
    ],
    workflows: [
      {
        key: "announcements",
        title: "Mededelingen klaarzetten",
        description: "Maak praktijkbrede updates concreet: doelgroep, kanaal, deadline en eigenaar.",
        href: "/praktijkbeheer#mededelingen",
        cta: "Open mededelingenflow",
        status: "Operationeel",
      },
      {
        key: "deadlines",
        title: "Deadlines bewaken",
        description: "Bundel acties rond onboarding, protocollen, ontwikkeldoelen en verplichte checks.",
        href: "/praktijkbeheer#deadlines",
        cta: "Bekijk deadlinebord",
        status: `${metrics.openDevelopmentGoals} open doelen`,
      },
      {
        key: "conversations",
        title: "Gespreksplanning",
        description: "Plan voortgangs-, onboarding- en POP-gesprekken met duidelijke voorbereiding.",
        href: "/praktijkbeheer#gesprekken",
        cta: "Plan gesprekken",
        status: `${metrics.onboardingMembers} onboarding`,
      },
      {
        key: "reports",
        title: "Rapportage en export",
        description: "Gebruik praktijkmonitoring voor een managementsamenvatting zonder persoonlijke LMS-flow.",
        href: "/praktijkbeheer#rapportage",
        cta: "Maak export",
        status: "Praktijkbreed",
      },
      {
        key: "library",
        title: "Bibliotheekbeheer voorbereiden",
        description: "Signaleer verlopen protocollen, ontbrekende formats en documenten die review nodig hebben.",
        href: "/praktijkbeheer#bibliotheek",
        cta: "Check bibliotheek",
        status: `${metrics.publishedDocuments} gepubliceerd`,
      },
    ],
    exportLinks: [
      {
        label: "Praktijkmonitor",
        href: "/team?focus=rapportage",
        description: "Voortgang per medewerker voor managementoverleg.",
      },
      {
        label: "Bibliotheekformats",
        href: "/bibliotheek?type=FORMAT",
        description: "Formats voor gesprekken, verbeteracties en borging.",
      },
      {
        label: "Werkafspraken",
        href: "/bibliotheek?type=WERKAFSPRAAK",
        description: "Actuele afspraken die teamcommunicatie ondersteunen.",
      },
    ],
  };
}
