import test from "node:test";
import assert from "node:assert/strict";

import {
  getAudienceContextItems,
  getAudienceDashboardCopy,
  getDevelopmentPromptCopy,
} from "../../src/lib/dashboard-copy.ts";
import { AUDIENCE_PROFILES, getAudienceProfileLabel } from "../../src/lib/audience.ts";

test("dashboardcopy houdt dezelfde persoonlijke structuur per doelgroep", () => {
  const copies = AUDIENCE_PROFILES.map((profile) => getAudienceDashboardCopy(profile, "Sam"));

  for (const copy of copies) {
    assert.deepEqual(Object.keys(copy), ["eyebrow", "title", "description", "quickLinks"]);
    assert.equal(copy.title, "Goed om je te zien, Sam");
    assert.equal(copy.quickLinks.length, 3);
    assert.deepEqual(
      copy.quickLinks.map((item) => item.href),
      ["/academy", "/bibliotheek", "/onboarding"],
    );
  }
});

test("praktijkondersteuner-copy benoemt context zonder planning, declaraties of EPD-operatie", () => {
  const allText = [
    ...Object.values(getAudienceDashboardCopy("PRAKTIJKONDERSTEUNER", "Puck")).flatMap((value) =>
      typeof value === "string" ? value : value.flatMap((item) => [item.title, item.text]),
    ),
    ...Object.values(getDevelopmentPromptCopy("PRAKTIJKONDERSTEUNER")).flatMap((value) =>
      Array.isArray(value) ? value : [value],
    ),
    ...getAudienceContextItems("PRAKTIJKONDERSTEUNER").flatMap((item) => [item.title, item.text]),
  ].join(" ").toLowerCase();

  assert.match(allText, /praktijkondersteuner|patiëntcommunicatie|werkafspraken|service|avg/);
  assert.doesNotMatch(allText, /planning|declaratie|declaraties|epd/);
});

test("doelgroepcontext sluit aan op labels en inhoud", () => {
  assert.equal(getAudienceProfileLabel("FYSIOTHERAPEUT"), "Fysiotherapeut");
  assert.match(getAudienceDashboardCopy("FYSIOTHERAPEUT", "Fien").eyebrow, /Fysiotherapeut/);
  assert.match(getAudienceContextItems("FYSIOTHERAPEUT").map((item) => item.text).join(" "), /klinisch redeneren|richtlijnen/);
  assert.match(getAudienceContextItems("FITCOACH").map((item) => item.text).join(" "), /leefstijl|training|fysio/);
});

test("ontwikkelprompts zijn vrij en voegen geen vaste POP-categorieën toe", () => {
  for (const profile of AUDIENCE_PROFILES) {
    const prompt = getDevelopmentPromptCopy(profile);
    assert.deepEqual(Object.keys(prompt), ["audienceLabel", "intro", "goalTitlePlaceholder", "goalDescriptionPlaceholder", "documentTitlePlaceholder", "documentDescriptionPlaceholder", "quickFocuses"]);
    assert.match(prompt.intro.toLowerCase(), /pop is vrij/);
    assert.equal(prompt.quickFocuses.length, 3);
    assert.doesNotMatch(prompt.quickFocuses.join(" ").toLowerCase(), /pop-categorie/);
  }
});

test("dashboardcopy geeft nieuwe array-instanties terug zodat callers broncopy niet muteren", () => {
  const firstDashboard = getAudienceDashboardCopy("FYSIOTHERAPEUT", "Sam");
  firstDashboard.quickLinks.push({ href: "/test", title: "Test", text: "Mutatie" });

  const secondDashboard = getAudienceDashboardCopy("FYSIOTHERAPEUT", "Sam");
  assert.equal(secondDashboard.quickLinks.length, 3);

  const firstPrompt = getDevelopmentPromptCopy("FITCOACH");
  firstPrompt.quickFocuses.push("Mutatie");

  const secondPrompt = getDevelopmentPromptCopy("FITCOACH");
  assert.equal(secondPrompt.quickFocuses.length, 3);

  const firstContext = getAudienceContextItems("PRAKTIJKONDERSTEUNER");
  firstContext[0].title = "Mutatie";

  const secondContext = getAudienceContextItems("PRAKTIJKONDERSTEUNER");
  assert.notEqual(secondContext[0].title, "Mutatie");
});
