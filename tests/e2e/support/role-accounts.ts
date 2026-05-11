export type E2ERole =
  | "MEDEWERKER"
  | "TEAMLEIDER"
  | "PRAKTIJKMANAGER"
  | "PRAKTIJKHOUDER"
  | "BEHEERDER"
  | "REVIEWER";

export type RoleAccount = {
  role: E2ERole;
  email: string;
  password: string;
};

export type RoleAccessExpectation = {
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

export const roleAccessMatrix: Record<E2ERole, RoleAccessExpectation> = {
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

export function missingRoleAccountMessage(): string {
  return [
    "Zet per rol E2E_<ROL>_EMAIL en E2E_<ROL>_PASSWORD om ingelogde roltests te draaien.",
    "Voorbeeld rollen: MEDEWERKER, TEAMLEIDER, PRAKTIJKMANAGER, PRAKTIJKHOUDER, BEHEERDER, REVIEWER.",
    "Secrets horen lokaal of in CI env-vars, nooit in git.",
  ].join(" ");
}
