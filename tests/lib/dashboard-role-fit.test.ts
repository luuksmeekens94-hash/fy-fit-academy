import test from "node:test";
import assert from "node:assert/strict";

import { getDashboardRoleFit } from "../../src/lib/dashboard-role-fit.ts";

test("praktijkhouderdashboard is practice-first ondanks eigen LMS", () => {
  const fit = getDashboardRoleFit("PRAKTIJKHOUDER", "Sjoerd", "FYSIOTHERAPEUT");

  assert.equal(fit.primaryMode, "PRACTICE");
  assert.equal(fit.copy.eyebrow, "Praktijkdashboard");
  assert.match(fit.copy.title, /praktijk/i);
  assert.match(fit.copy.description, /praktijk|team|voortgang/i);
  assert.notEqual(fit.primaryStats[0].label, "Openstaande e-learnings");
  assert.match(fit.primaryStats[0].label, /Praktijkleden|Praktijk/i);
  assert.ok(fit.secondaryLinks.some((link) => link.href === "/academy"));
  assert.ok(fit.secondaryLinks.some((link) => link.href === "/academy/certificates"));
  assert.ok(![...fit.primaryLinks, ...fit.secondaryLinks].some((link) => link.href === "/admin"));
});

test("medewerker blijft personal-first met eigen Academy en ontwikkeling", () => {
  const fit = getDashboardRoleFit("MEDEWERKER", "Mila", "FYSIOTHERAPEUT");

  assert.equal(fit.primaryMode, "PERSONAL");
  assert.match(fit.primaryStats[0].label, /Openstaande e-learnings/);
  assert.ok(fit.primaryLinks.some((link) => link.href === "/academy"));
  assert.ok(fit.primaryLinks.some((link) => link.href === "/ontwikkeling"));
});

test("teamleider behoudt personal-first met teamlaag als primaire extra", () => {
  const fit = getDashboardRoleFit("TEAMLEIDER", "Tessa", "FYSIOTHERAPEUT");

  assert.equal(fit.primaryMode, "TEAM");
  assert.ok(fit.primaryLinks.some((link) => link.href === "/team"));
  assert.ok(fit.secondaryLinks.some((link) => link.href === "/academy/certificates"));
});

test("praktijkmanager is practice-first zonder persoonlijke LMS-links", () => {
  const fit = getDashboardRoleFit("PRAKTIJKMANAGER", "Petra", "PRAKTIJKONDERSTEUNER");

  assert.equal(fit.primaryMode, "PRACTICE");
  assert.equal(fit.copy.eyebrow, "Praktijkmonitor");
  assert.equal(fit.primaryLinks[0].href, "/praktijkbeheer");
  assert.equal(fit.primaryLinks[0].title, "Praktijkbeheer");
  assert.ok(fit.primaryLinks.some((link) => link.href === "/team"));
  assert.ok(![...fit.primaryLinks, ...fit.secondaryLinks].some((link) => link.href === "/academy"));
  assert.ok(![...fit.primaryLinks, ...fit.secondaryLinks].some((link) => link.href === "/academy/certificates"));
});
