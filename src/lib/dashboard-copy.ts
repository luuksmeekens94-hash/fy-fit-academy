import { getAudienceProfileLabel } from "@/lib/audience";
import type { AudienceProfile } from "@/lib/types";

type QuickLinkCopy = {
  href: string;
  title: string;
  text: string;
};

type AudienceContextItem = {
  title: string;
  text: string;
};

type AudienceDashboardCopy = {
  eyebrow: string;
  title: string;
  description: string;
  quickLinks: QuickLinkCopy[];
};

type DevelopmentPromptCopy = {
  audienceLabel: string;
  intro: string;
  goalTitlePlaceholder: string;
  goalDescriptionPlaceholder: string;
  documentTitlePlaceholder: string;
  documentDescriptionPlaceholder: string;
  quickFocuses: string[];
};

const AUDIENCE_DASHBOARD_CONTENT: Record<AudienceProfile, Pick<AudienceDashboardCopy, "eyebrow" | "description" | "quickLinks">> = {
  FYSIOTHERAPEUT: {
    eyebrow: "Persoonlijk dashboard · Fysiotherapeut",
    description:
      "Jouw Academy combineert e-learnings, richtlijnen, klinisch redeneren en persoonlijke ontwikkeling in één rustige leeromgeving.",
    quickLinks: [
      { href: "/academy", title: "Academy", text: "Werk verder aan e-learnings over vakinhoud, richtlijnen en klinisch redeneren." },
      { href: "/bibliotheek", title: "Bibliotheek", text: "Pak richtlijnen, werkafspraken en kernboodschappen erbij wanneer je leert of reflecteert." },
      { href: "/onboarding", title: "Onboarding", text: "Bekijk je volgende inwerkstap en koppel reflecties aan je persoonlijke ontwikkeling." },
    ],
  },
  PRAKTIJKONDERSTEUNER: {
    eyebrow: "Persoonlijk dashboard · Praktijkondersteuner",
    description:
      "Jouw Academy brengt e-learnings, patiëntcommunicatie, werkafspraken, service, AVG en persoonlijke ontwikkeling overzichtelijk samen.",
    quickLinks: [
      { href: "/academy", title: "Academy", text: "Werk verder aan e-learnings over communicatie, service, AVG en praktijkafspraken." },
      { href: "/bibliotheek", title: "Bibliotheek", text: "Vind werkafspraken, kernboodschappen en formats die helpen bij leren en informeren." },
      { href: "/onboarding", title: "Onboarding", text: "Bekijk je volgende inwerkstap en leg vragen of reflecties vast voor je begeleider." },
    ],
  },
  FITCOACH: {
    eyebrow: "Persoonlijk dashboard · Fitcoach",
    description:
      "Jouw Academy ondersteunt coaching, leefstijl, training en bewegen, samenwerking met fysio en persoonlijke ontwikkeling.",
    quickLinks: [
      { href: "/academy", title: "Academy", text: "Werk verder aan e-learnings over coaching, leefstijl, training en bewegen." },
      { href: "/bibliotheek", title: "Bibliotheek", text: "Vind formats, kernboodschappen en afspraken voor samenwerking met fysio en team." },
      { href: "/onboarding", title: "Onboarding", text: "Bekijk je volgende inwerkstap en vertaal inzichten naar je coachingpraktijk." },
    ],
  },
};

const AUDIENCE_CONTEXT_ITEMS: Record<AudienceProfile, AudienceContextItem[]> = {
  FYSIOTHERAPEUT: [
    { title: "Vakinhoud", text: "E-learnings en richtlijnen helpen je klinisch redeneren actueel te houden." },
    { title: "Reflectie", text: "Koppel casuïstiek, feedback en persoonlijke ontwikkeling aan je eigen ontwikkeldoelen." },
    { title: "Samen leren", text: "Gebruik kernboodschappen en werkafspraken om kennis met collega’s te delen." },
  ],
  PRAKTIJKONDERSTEUNER: [
    { title: "Communicatie", text: "E-learnings ondersteunen heldere patiëntcommunicatie en zorgvuldig informeren." },
    { title: "Werkafspraken", text: "Werkafspraken, service en AVG vormen de context voor leren en ontwikkelen." },
    { title: "Ontwikkeling", text: "Leg eigen ontwikkeldoelen, vragen en reflecties vast vanuit je rol als praktijkondersteuner." },
  ],
  FITCOACH: [
    { title: "Coaching", text: "E-learnings helpen je coaching, leefstijlgesprekken en gedragsverandering te verdiepen." },
    { title: "Bewegen", text: "Training, bewegen en belastbaarheid vormen de context voor jouw leerpad." },
    { title: "Samenwerking", text: "Versterk samenwerking met fysio en team door afspraken, reflecties en inzichten te bundelen." },
  ],
};

const DEVELOPMENT_PROMPTS: Record<AudienceProfile, Omit<DevelopmentPromptCopy, "audienceLabel">> = {
  FYSIOTHERAPEUT: {
    intro:
      "POP is vrij: beschrijf jouw eigen doel, actie of reflectie. Gebruik bijvoorbeeld klinisch redeneren, richtlijnen of feedback als context, zonder vaste categorieën.",
    goalTitlePlaceholder: "Bijvoorbeeld: klinisch redeneren bij schouderklachten verdiepen",
    goalDescriptionPlaceholder:
      "Beschrijf je persoonlijke ontwikkeldoel SMART. Bijvoorbeeld: binnen 6 weken bij 3 casussen expliciet onderbouwen welke richtlijn, bevindingen en vervolgstap leidend zijn.",
    documentTitlePlaceholder: "Bijvoorbeeld: reflectie richtlijngebruik Q3",
    documentDescriptionPlaceholder: "Korte samenvatting van je reflectie, actie, feedback of bewijsstuk voor je eigen ontwikkelmap.",
    quickFocuses: ["Klinisch redeneren", "Richtlijnen toepassen", "Persoonlijke reflectie"],
  },
  PRAKTIJKONDERSTEUNER: {
    intro:
      "POP is vrij: beschrijf jouw eigen doel, actie of reflectie. Gebruik bijvoorbeeld patiëntcommunicatie, werkafspraken, service of AVG als context, zonder vaste categorieën.",
    goalTitlePlaceholder: "Bijvoorbeeld: patiëntcommunicatie bij vragen consistenter maken",
    goalDescriptionPlaceholder:
      "Beschrijf je persoonlijke ontwikkeldoel SMART. Bijvoorbeeld: binnen 4 weken bij veelgestelde vragen steeds dezelfde kernboodschap gebruiken en feedback vragen aan je begeleider.",
    documentTitlePlaceholder: "Bijvoorbeeld: reflectie patiëntcommunicatie Q3",
    documentDescriptionPlaceholder: "Korte samenvatting van je reflectie, actie, feedback of bewijsstuk voor je eigen ontwikkelmap.",
    quickFocuses: ["Patiëntcommunicatie", "Werkafspraken", "Service en AVG"],
  },
  FITCOACH: {
    intro:
      "POP is vrij: beschrijf jouw eigen doel, actie of reflectie. Gebruik bijvoorbeeld coaching, leefstijl, training, bewegen of samenwerking als context, zonder vaste categorieën.",
    goalTitlePlaceholder: "Bijvoorbeeld: leefstijlcoaching concreter opvolgen",
    goalDescriptionPlaceholder:
      "Beschrijf je persoonlijke ontwikkeldoel SMART. Bijvoorbeeld: binnen 6 weken bij 3 deelnemers een haalbare beweegactie formuleren en de opvolging kort reflecteren.",
    documentTitlePlaceholder: "Bijvoorbeeld: reflectie coaching en training Q3",
    documentDescriptionPlaceholder: "Korte samenvatting van je reflectie, actie, feedback of bewijsstuk voor je eigen ontwikkelmap.",
    quickFocuses: ["Coaching", "Leefstijl en training", "Samenwerking met fysio"],
  },
};

export function getAudienceDashboardCopy(audienceProfile: AudienceProfile, firstName: string): AudienceDashboardCopy {
  const copy = AUDIENCE_DASHBOARD_CONTENT[audienceProfile];

  return {
    eyebrow: copy.eyebrow,
    title: `Goed om je te zien, ${firstName}`,
    description: copy.description,
    quickLinks: copy.quickLinks.map((item) => ({ ...item })),
  };
}

export function getDevelopmentPromptCopy(audienceProfile: AudienceProfile): DevelopmentPromptCopy {
  const prompt = DEVELOPMENT_PROMPTS[audienceProfile];

  return {
    audienceLabel: getAudienceProfileLabel(audienceProfile),
    ...prompt,
    quickFocuses: [...prompt.quickFocuses],
  };
}

export function getAudienceContextItems(audienceProfile: AudienceProfile): AudienceContextItem[] {
  return AUDIENCE_CONTEXT_ITEMS[audienceProfile].map((item) => ({ ...item }));
}
