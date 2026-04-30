import test from "node:test";
import assert from "node:assert/strict";

import {
  parseAuthorExpertsInput,
  parseCompetencyReferencesInput,
  parseLearningObjectivesInput,
  parseLiteratureReferencesInput,
  parseModulesInput,
} from "../../../src/lib/lms/accreditation-admin.ts";

test("parseAuthorExpertsInput converts pipe-separated experts into structured metadata", () => {
  assert.deepEqual(
    parseAuthorExpertsInput("Sjoerd||Inhoudsdeskundige||Fy-Fit||KRF-123\nLuuk||Auteur"),
    [
      { name: "Sjoerd", role: "Inhoudsdeskundige", organization: "Fy-Fit", registrationNumber: "KRF-123" },
      { name: "Luuk", role: "Auteur" },
    ],
  );
});

test("parseModulesInput requires title and duration and maps work forms", () => {
  assert.deepEqual(
    parseModulesInput("1||Consultvoering||120||Intro||Samenvatting||tekst, casus"),
    [
      {
        order: 1,
        title: "Consultvoering",
        estimatedMinutes: 120,
        introduction: "Intro",
        summary: "Samenvatting",
        workForms: ["TEKST", "CASUS"],
      },
    ],
  );

  assert.throws(
    () => parseModulesInput("1||Onvolledig"),
    /Module-regel 1 heeft minimaal volgorde, titel en duur nodig/,
  );
});

test("parseLearningObjectivesInput supports optional module order mapping", () => {
  assert.deepEqual(
    parseLearningObjectivesInput("LO1||Na afloop kan de deelnemer uitleggen...||1\nLO2||Na afloop kan de deelnemer toepassen..."),
    [
      { code: "LO1", text: "Na afloop kan de deelnemer uitleggen...", order: 1, moduleOrder: 1 },
      { code: "LO2", text: "Na afloop kan de deelnemer toepassen...", order: 2, moduleOrder: null },
    ],
  );
});

test("parseLiteratureReferencesInput and parseCompetencyReferencesInput parse optional module orders", () => {
  assert.deepEqual(
    parseLiteratureReferencesInput("1||KNGF-richtlijn||KNGF||https://example.nl||KNGF||2024||1"),
    [
      {
        order: 1,
        title: "KNGF-richtlijn",
        source: "KNGF",
        url: "https://example.nl",
        guideline: "KNGF",
        year: 2024,
        moduleOrder: 1,
      },
    ],
  );

  assert.deepEqual(
    parseCompetencyReferencesInput("Communicator||CanMEDS||Therapeutische communicatie||1"),
    [
      {
        name: "Communicator",
        framework: "CanMEDS",
        description: "Therapeutische communicatie",
        moduleOrder: 1,
      },
    ],
  );
});
