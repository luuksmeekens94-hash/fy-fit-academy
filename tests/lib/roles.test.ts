import test from "node:test";
import assert from "node:assert/strict";

import {
  canManageAcademy,
  canMonitorOwnTeam,
  canMonitorPractice,
  canOpenTeamRoutes,
  canReviewAccreditation,
  canUsePersonalDevelopment,
  canUsePersonalLms,
  getNavigationItems,
  PERSONAL_LMS_ROLES,
  PRACTICE_MONITOR_ROLES,
} from "../../src/lib/roles.ts";

test("PERSONAL_LMS_ROLES bevat medewerker, teamleider en praktijkhouder", () => {
  assert.deepEqual([...PERSONAL_LMS_ROLES], ["MEDEWERKER", "TEAMLEIDER", "PRAKTIJKHOUDER"]);
  assert.equal(canUsePersonalLms("MEDEWERKER"), true);
  assert.equal(canUsePersonalLms("TEAMLEIDER"), true);
  assert.equal(canUsePersonalLms("PRAKTIJKHOUDER"), true);
  assert.equal(canUsePersonalLms("PRAKTIJKMANAGER"), false);
});

test("praktijkmonitor rollen zijn praktijkmanager, praktijkhouder en beheerder", () => {
  assert.deepEqual([...PRACTICE_MONITOR_ROLES], ["PRAKTIJKMANAGER", "PRAKTIJKHOUDER", "BEHEERDER"]);
  assert.equal(canMonitorPractice("PRAKTIJKMANAGER"), true);
  assert.equal(canMonitorPractice("PRAKTIJKHOUDER"), true);
  assert.equal(canMonitorPractice("BEHEERDER"), true);
  assert.equal(canMonitorPractice("TEAMLEIDER"), false);
});

test("teamleider monitort eigen team en praktijkbrede rollen openen teamroutes", () => {
  assert.equal(canMonitorOwnTeam("TEAMLEIDER"), true);
  assert.equal(canOpenTeamRoutes("TEAMLEIDER"), true);
  assert.equal(canOpenTeamRoutes("PRAKTIJKMANAGER"), true);
  assert.equal(canOpenTeamRoutes("PRAKTIJKHOUDER"), true);
  assert.equal(canOpenTeamRoutes("BEHEERDER"), true);
  assert.equal(canOpenTeamRoutes("MEDEWERKER"), false);
  assert.equal(canOpenTeamRoutes("REVIEWER"), false);
});

test("persoonlijke ontwikkeling is geen praktijkmanager- of praktijkhouder-flow", () => {
  assert.equal(canUsePersonalDevelopment("MEDEWERKER"), true);
  assert.equal(canUsePersonalDevelopment("TEAMLEIDER"), true);
  assert.equal(canUsePersonalDevelopment("PRAKTIJKHOUDER"), false);
  assert.equal(canUsePersonalDevelopment("PRAKTIJKMANAGER"), false);
});

test("beheer en accreditatiereview hebben aparte rechten", () => {
  assert.equal(canManageAcademy("BEHEERDER"), true);
  assert.equal(canManageAcademy("PRAKTIJKHOUDER"), false);
  assert.equal(canReviewAccreditation("REVIEWER"), true);
  assert.equal(canReviewAccreditation("BEHEERDER"), true);
  assert.equal(canReviewAccreditation("PRAKTIJKMANAGER"), false);
});

test("navigatie verbergt persoonlijke flows voor praktijkmanager en toont praktijkbeheer", () => {
  const items = getNavigationItems("PRAKTIJKMANAGER", true);
  assert.deepEqual(items.map((item) => item.href), ["/", "/praktijkbeheer", "/bibliotheek", "/team"]);
  assert.equal(items[0].label, "Praktijkmonitor");
  assert.equal(items[1].label, "Praktijkbeheer");
});

test("praktijkhouder behoudt Academy, certificaten en krijgt praktijkmonitor", () => {
  const items = getNavigationItems("PRAKTIJKHOUDER");
  assert.deepEqual(items.map((item) => item.href), ["/", "/academy", "/academy/certificates", "/bibliotheek", "/team"]);
  assert.equal(items[0].label, "Praktijkdashboard");
  assert.equal(items[2].label, "Certificaten");
});

test("beheerder ziet LMS, Academybeheer en Admin als aparte beheerlagen", () => {
  const items = getNavigationItems("BEHEERDER");

  assert.ok(items.some((item) => item.href === "/lms" && item.label === "LMS cockpit"));
  assert.ok(items.some((item) => item.href === "/academybeheer" && item.label === "Academybeheer"));
  assert.ok(items.some((item) => item.href === "/admin" && item.label === "Admin"));
});

test("reviewer ziet alleen de e-learning als navigatie", () => {
  const items = getNavigationItems("REVIEWER");

  assert.deepEqual(items, [{ href: "/lms", label: "E-learning" }]);
});

test("medewerker ziet certificaten als Academy-route in plaats van LMS-route", () => {
  const items = getNavigationItems("MEDEWERKER");

  assert.deepEqual(items.map((item) => item.href), ["/", "/academy", "/academy/certificates", "/ontwikkeling", "/bibliotheek"]);
  assert.equal(items[2].label, "Certificaten");
});
