import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLessonSlug,
  getNextModuleOrder,
  parseAuthorExpertsInput,
  parseCompetencyReferencesInput,
  parseLearningObjectivesInput,
  parseLiteratureReferencesInput,
  parseModulesInput,
  parseLessonBuilderInput,
  parseQuestionBuilderInput,
  reorderModulesAfterMove,
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

test("buildLessonSlug creates readable unique lesson slugs", () => {
  assert.equal(buildLessonSlug("Klinisch redeneren: module 1", []), "klinisch-redeneren-module-1");
  assert.equal(
    buildLessonSlug("Klinisch redeneren: module 1", ["introductie", "klinisch-redeneren-module-1"]),
    "klinisch-redeneren-module-1-2",
  );
});

test("parseLessonBuilderInput validates adminproof lesson form values", () => {
  assert.deepEqual(
    parseLessonBuilderInput({
      title: "Video: intake observeren",
      description: "Bekijk de intake en noteer klinische signalen.",
      type: "VIDEO",
      content: "Bekijk eerst de video en noteer klinische signalen.",
      mediaUrl: "/lms/intake.mp4",
      mediaLabel: "Intakevideo",
      order: "2",
      estimatedMinutes: "18",
      isRequired: "on",
    }),
    {
      title: "Video: intake observeren",
      description: "Bekijk de intake en noteer klinische signalen.",
      type: "VIDEO",
      content: "Bekijk eerst de video en noteer klinische signalen.\n\nIntakevideo: /lms/intake.mp4",
      order: 2,
      estimatedMinutes: 18,
      isRequired: true,
    },
  );

  assert.throws(
    () => parseLessonBuilderInput({ title: "Te kort", type: "VIDEO", content: "", mediaUrl: "", order: "1", estimatedMinutes: "5" }),
    /Video- of documentlessen hebben een link of beschrijving nodig/,
  );
});

test("module builder helpers calculate next order and safe move order", () => {
  const modules = [
    { id: "m1", order: 1 },
    { id: "m2", order: 2 },
    { id: "m3", order: 3 },
  ];

  assert.equal(getNextModuleOrder(modules), 4);
  assert.deepEqual(reorderModulesAfterMove(modules, "m2", "up"), [
    { id: "m2", order: 1 },
    { id: "m1", order: 2 },
    { id: "m3", order: 3 },
  ]);
  assert.deepEqual(reorderModulesAfterMove(modules, "m2", "down"), [
    { id: "m1", order: 1 },
    { id: "m3", order: 2 },
    { id: "m2", order: 3 },
  ]);
});

test("parseQuestionBuilderInput validates answer options and objective links", () => {
  assert.deepEqual(
    parseQuestionBuilderInput({
      prompt: "Welke signalen passen bij gele vlaggen?",
      type: "MULTIPLE_RESPONSE",
      explanation: "Gele vlaggen zijn psychosociale herstelbelemmerende factoren.",
      order: "3",
      points: "2",
      options: "Pijneducatie overslaan||false\nCatastroferen||true\nAngst voor bewegen||true",
      objectiveIds: ["lo1", "lo2"],
    }),
    {
      prompt: "Welke signalen passen bij gele vlaggen?",
      type: "MULTIPLE_RESPONSE",
      explanation: "Gele vlaggen zijn psychosociale herstelbelemmerende factoren.",
      order: 3,
      points: 2,
      options: [
        { label: "Pijneducatie overslaan", isCorrect: false, order: 1 },
        { label: "Catastroferen", isCorrect: true, order: 2 },
        { label: "Angst voor bewegen", isCorrect: true, order: 3 },
      ],
      objectiveIds: ["lo1", "lo2"],
    },
  );

  assert.throws(
    () => parseQuestionBuilderInput({ prompt: "Welke optie is juist in deze casus?", options: "A||false\nB||false", objectiveIds: ["lo1"] }),
    /Minimaal één antwoordoptie moet juist zijn/,
  );

  assert.throws(
    () => parseQuestionBuilderInput({ prompt: "Open reflectievraag over toepassing in de praktijk", type: "OPEN_TEXT", objectiveIds: [] }),
    /Koppel minimaal één leerdoel/,
  );
});
