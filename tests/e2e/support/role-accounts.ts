export type E2ERole =
  | "MEDEWERKER"
  | "TEAMLEIDER"
  | "PRAKTIJKMANAGER"
  | "PRAKTIJKHOUDER"
  | "BEHEERDER"
  | "REVIEWER";

export type E2EAudienceProfile = "FYSIOTHERAPEUT" | "PRAKTIJKONDERSTEUNER" | "FITCOACH";

export type RoleAccount = {
  role: E2ERole;
  email: string;
  password: string;
};

export type AudienceAccount = {
  audienceProfile: E2EAudienceProfile;
  email: string;
  password: string;
};

export type AccessExpectation = {
  label: string;
  allowedRoutes: string[];
  forbiddenRoutes: string[];
  requiredText: RegExp[];
};

export const roleOrder: E2ERole[] = [
  "MEDEWERKER",
  "TEAMLEIDER",
  "PRAKTIJKMANAGER",
  "PRAKTIJKHOUDER",
  "BEHEERDER",
  "REVIEWER",
];

export const audienceProfileOrder: E2EAudienceProfile[] = ["FYSIOTHERAPEUT", "PRAKTIJKONDERSTEUNER", "FITCOACH"];

export const roleAccessMatrix: Record<E2ERole, AccessExpectation> = {
  MEDEWERKER: {
    label: "Medewerker",
    allowedRoutes: ["/academy", "/ontwikkeling", "/mijn-gegevens"],
    forbiddenRoutes: ["/team", "/praktijkbeheer", "/academybeheer", "/admin"],
    requiredText: [/academy|leren|ontwikkeling/i],
  },
  TEAMLEIDER: {
    label: "Teamleider",
    allowedRoutes: ["/academy", "/team", "/ontwikkeling"],
    forbiddenRoutes: ["/praktijkbeheer", "/academybeheer", "/admin"],
    requiredText: [/team|academy|ontwikkeling/i],
  },
  PRAKTIJKMANAGER: {
    label: "Praktijkmanager",
    allowedRoutes: ["/praktijkbeheer", "/team"],
    forbiddenRoutes: ["/academy", "/academybeheer", "/admin"],
    requiredText: [/praktijkbeheer|praktijk|team/i],
  },
  PRAKTIJKHOUDER: {
    label: "Praktijkhouder",
    allowedRoutes: ["/praktijkbeheer", "/academy", "/team"],
    forbiddenRoutes: ["/academybeheer", "/admin"],
    requiredText: [/praktijkbeheer|praktijk|academy/i],
  },
  BEHEERDER: {
    label: "Beheerder",
    allowedRoutes: ["/academybeheer", "/lms", "/admin"],
    forbiddenRoutes: [],
    requiredText: [/academybeheer|beheer|lms|admin/i],
  },
  REVIEWER: {
    label: "Reviewer",
    allowedRoutes: ["/academybeheer", "/lms"],
    forbiddenRoutes: ["/praktijkbeheer", "/admin"],
    requiredText: [/academybeheer|review|lms|accreditatie/i],
  },
};

export const audienceAccessMatrix: Record<E2EAudienceProfile, AccessExpectation> = {
  FYSIOTHERAPEUT: {
    label: "Fysiotherapeut",
    allowedRoutes: ["/academy", "/ontwikkeling", "/mijn-gegevens"],
    forbiddenRoutes: ["/praktijkbeheer", "/academybeheer", "/admin"],
    requiredText: [/fysio|academy|ontwikkeling|leren/i],
  },
  PRAKTIJKONDERSTEUNER: {
    label: "Praktijkondersteuner",
    allowedRoutes: ["/academy", "/ontwikkeling", "/mijn-gegevens"],
    forbiddenRoutes: ["/praktijkbeheer", "/academybeheer", "/admin"],
    requiredText: [/praktijkondersteuner|ondersteuning|academy|ontwikkeling|leren/i],
  },
  FITCOACH: {
    label: "Fitcoach",
    allowedRoutes: ["/academy", "/ontwikkeling", "/mijn-gegevens"],
    forbiddenRoutes: ["/praktijkbeheer", "/academybeheer", "/admin"],
    requiredText: [/fitcoach|fit|academy|ontwikkeling|leren/i],
  },
};

export function getConfiguredRoleAccounts(env: NodeJS.ProcessEnv = process.env): RoleAccount[] {
  return roleOrder.flatMap((role) => {
    const email = env[`E2E_${role}_EMAIL`];
    const password = env[`E2E_${role}_PASSWORD`];

    if (!email || !password) {
      return [];
    }

    return [{ role, email, password }];
  });
}

export function getConfiguredAudienceAccounts(env: NodeJS.ProcessEnv = process.env): AudienceAccount[] {
  return audienceProfileOrder.flatMap((audienceProfile) => {
    const email = env[`E2E_${audienceProfile}_EMAIL`];
    const password = env[`E2E_${audienceProfile}_PASSWORD`];

    if (!email || !password) {
      return [];
    }

    return [{ audienceProfile, email, password }];
  });
}

export function missingRoleAccountMessage(): string {
  return [
    "Zet per rol E2E_<ROL>_EMAIL en E2E_<ROL>_PASSWORD om ingelogde roltests te draaien.",
    "Voorbeeld rollen: MEDEWERKER, TEAMLEIDER, PRAKTIJKMANAGER, PRAKTIJKHOUDER, BEHEERDER, REVIEWER.",
    "Secrets horen lokaal of in CI env-vars, nooit in git.",
  ].join(" ");
}

export function missingAudienceAccountMessage(): string {
  return [
    "Zet per doelgroep E2E_<DOELGROEP>_EMAIL en E2E_<DOELGROEP>_PASSWORD om doelgroepgerichte Academy-tests te draaien.",
    "Voorbeeld doelgroepen: FYSIOTHERAPEUT, PRAKTIJKONDERSTEUNER, FITCOACH.",
    "Deze accounts zijn doorgaans medewerker-accounts met verschillend audienceProfile, geen aparte app-rollen.",
  ].join(" ");
}
