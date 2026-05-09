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

test("navigatie verbergt persoonlijke flows voor praktijkmanager", () => {
  const items = getNavigationItems("PRAKTIJKMANAGER", true);
  assert.deepEqual(items.map((item) => item.href), ["/", "/bibliotheek", "/team"]);
  assert.equal(items[0].label, "Praktijkmonitor");
});

test("praktijkhouder behoudt Academy en krijgt praktijkmonitor", () => {
  const items = getNavigationItems("PRAKTIJKHOUDER");
  assert.deepEqual(items.map((item) => item.href), ["/", "/academy", "/bibliotheek", "/team"]);
  assert.equal(items[0].label, "Praktijkdashboard");
});
