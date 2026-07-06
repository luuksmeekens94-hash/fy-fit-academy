import type { AudienceProfile, Role } from "@/lib/types";
import { getAudienceDashboardCopy } from "@/lib/dashboard-copy";

export type DashboardPrimaryMode = "PERSONAL" | "TEAM" | "PRACTICE" | "ADMIN" | "REVIEW";

export type DashboardRoleFitLink = {
  href: string;
  title: string;
  text: string;
};

export type DashboardRoleFitStat = {
  label: string;
  detail: string;
};

export type DashboardRoleFit = {
  primaryMode: DashboardPrimaryMode;
  copy: {
    eyebrow: string;
    title: string;
    description: string;
  };
  primaryStats: DashboardRoleFitStat[];
  primaryLinks: DashboardRoleFitLink[];
  secondaryLinks: DashboardRoleFitLink[];
};

function personalLearnerFit(firstName: string, audienceProfile: AudienceProfile): DashboardRoleFit {
  const audienceCopy = getAudienceDashboardCopy(audienceProfile, firstName);

  return {
    primaryMode: "PERSONAL",
    copy: {
      eyebrow: audienceCopy.eyebrow,
      title: audienceCopy.title,
      description: audienceCopy.description,
    },
    primaryStats: [
      {
        label: "Openstaande e-learnings",
        detail: "Nog te starten of af te ronden in jouw persoonlijke Academy-leerpad.",
      },
      {
        label: "Actieve ontwikkeldoelen",
        detail: "Eigen doelen, acties en reflecties die nu aandacht vragen.",
      },
      {
        label: "Ontwikkeldocumenten",
        detail: "Documenten, notities en vrije POP-items in je persoonlijke ontwikkelomgeving.",
      },
    ],
    primaryLinks: [
      { href: "/academy", title: "Academy", text: "Werk verder aan je eigen e-learnings." },
      { href: "/ontwikkeling", title: "Mijn ontwikkeling", text: "Werk aan doelen, POP en reflecties." },
      { href: "/bibliotheek", title: "Praktijkbibliotheek", text: "Vind richtlijnen, protocollen en materiaal." },
    ],
    secondaryLinks: [
      { href: "/academy/certificates", title: "Certificaten", text: "Download je eigen deelnamebewijzen." },
    ],
  };
}

function teamLeaderFit(firstName: string, audienceProfile: AudienceProfile): DashboardRoleFit {
  const personal = personalLearnerFit(firstName, audienceProfile);

  return {
    ...personal,
    primaryMode: "TEAM",
    primaryLinks: [
      { href: "/team", title: "Team", text: "Bekijk voortgang, onboarding en ontwikkelsignalen in je eigen team." },
      ...personal.primaryLinks,
    ],
  };
}

function practiceOwnerFit(): DashboardRoleFit {
  return {
    primaryMode: "PRACTICE",
    copy: {
      eyebrow: "Praktijkdashboard",
      title: "Hoe staat de praktijk ervoor?",
      description:
        "Praktijkbreed overzicht van teams, therapeuten, onboarding, e-learningvoortgang en ontwikkelsignalen. Je eigen Academy blijft beschikbaar, maar staat niet centraal.",
    },
    primaryStats: [
      {
        label: "Praktijkleden in beeld",
        detail: "Actieve collega’s zichtbaar in de praktijkmonitor, exclusief beheer- en revieweraccounts.",
      },
      {
        label: "Onboarding in praktijk",
        detail: "Collega’s met een actief inwerkpad die mogelijk begeleiding nodig hebben.",
      },
      {
        label: "Ontwikkelsignalen",
        detail: "Open doelen, gespreksdocumenten en voortgangssignalen per persoon of team.",
      },
    ],
    primaryLinks: [
      { href: "/team", title: "Praktijkmonitor", text: "Bekijk teams, therapeuten, onboarding en ontwikkelvoortgang." },
      { href: "/bibliotheek", title: "Bibliotheek", text: "Open protocollen, cursusmateriaal en praktijkafspraken." },
      { href: "/team?focus=rapportage", title: "Rapportagebasis", text: "Gebruik de praktijkmonitor als startpunt voor voortgangs- en ontwikkeloverzicht." },
    ],
    secondaryLinks: [
      { href: "/academy", title: "Eigen Academy", text: "Volg je eigen e-learnings wanneer dat nodig is." },
      { href: "/academy/certificates", title: "Eigen certificaten", text: "Download je persoonlijke deelnamebewijzen." },
    ],
  };
}

function practiceManagerFit(): DashboardRoleFit {
  return {
    primaryMode: "PRACTICE",
    copy: {
      eyebrow: "Praktijkmonitor",
      title: "Praktijkoverzicht",
      description: "Een rustig overzicht van onboarding, voortgang, gesprekken en ontwikkelsignalen binnen de praktijk, zonder persoonlijke LMS-flow.",
    },
    primaryStats: [
      {
        label: "Praktijkleden in beeld",
        detail: "Actieve collega’s zichtbaar in de praktijkmonitor.",
      },
      {
        label: "Onboarding in praktijk",
        detail: "Collega’s met een actief inwerkpad in dit basisbeeld.",
      },
      {
        label: "Monitorrol",
        detail: "Deze rol richt zich op overzicht in plaats van persoonlijke leerroute.",
      },
    ],
    primaryLinks: [
      { href: "/praktijkbeheer", title: "Praktijkbeheer", text: "Beheer mededelingen, deadlines, gesprekken, rapportage en bibliotheekborging." },
      { href: "/team", title: "Praktijkmonitor", text: "Bekijk voortgang, onboarding en ontwikkelsignalen." },
      { href: "/bibliotheek", title: "Praktijkbibliotheek", text: "Raadpleeg protocollen, documenten en cursusmateriaal." },
    ],
    secondaryLinks: [],
  };
}

export function getDashboardRoleFit(
  role: Role,
  firstName: string,
  audienceProfile: AudienceProfile,
): DashboardRoleFit {
  if (role === "PRAKTIJKHOUDER") {
    return practiceOwnerFit();
  }

  if (role === "PRAKTIJKMANAGER") {
    return practiceManagerFit();
  }

  if (role === "TEAMLEIDER") {
    return teamLeaderFit(firstName, audienceProfile);
  }

  if (role === "BEHEERDER") {
    return {
      primaryMode: "ADMIN",
      copy: {
        eyebrow: "Cockpit",
        title: "Academy- en praktijkcockpit",
        description: "Beheer de leeromgeving en houd praktijkbreed zicht op voortgang, onboarding en ontwikkelondersteuning.",
      },
      primaryStats: [
        { label: "Praktijkleden in beeld", detail: "Actieve collega’s zichtbaar in de praktijkmonitor." },
        { label: "Academybeheer", detail: "Beheer loopt via Admin en LMS cockpit." },
        { label: "Onboarding in praktijk", detail: "Aantal collega’s met een actief inwerkpad." },
      ],
      primaryLinks: [
        { href: "/academybeheer", title: "Academybeheer", text: "Beheer toetsvragen, evaluaties, accreditatie en cursusversies." },
        { href: "/admin", title: "Admin", text: "Beheer content, gebruikers, onboarding en bewijs." },
        { href: "/lms", title: "LMS cockpit", text: "Bekijk cursussen, reviewer-preview en accreditatiecontext." },
        { href: "/team", title: "Praktijkmonitor", text: "Bekijk praktijkbrede voortgang." },
      ],
      secondaryLinks: [],
    };
  }

  if (role === "REVIEWER") {
    return {
      primaryMode: "REVIEW",
      copy: {
        eyebrow: "Accreditatie-preview",
        title: "Revieweromgeving",
        description: "Bekijk LMS-inhoud en accreditatiecontext in een heldere previewomgeving.",
      },
      primaryStats: [
        { label: "Previewmodus", detail: "Reviewerweergave voor accreditatiecontrole." },
        { label: "Monitorrol", detail: "Deze rol is alleen voor inhoudelijke accreditatiereview." },
        { label: "Onboarding in praktijk", detail: "Niet van toepassing voor revieweraccounts." },
      ],
      primaryLinks: [
        { href: "/lms", title: "Accreditatie-preview", text: "Open veilige reviewer-preview van LMS-inhoud." },
        { href: "/bibliotheek", title: "Praktijkbibliotheek", text: "Bekijk gepubliceerde praktijkdocumenten." },
      ],
      secondaryLinks: [],
    };
  }

  return personalLearnerFit(firstName, audienceProfile);
}
