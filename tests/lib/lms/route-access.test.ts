import test from "node:test";
import assert from "node:assert/strict";

import { getLearnerLmsRedirectPath } from "../../../src/lib/lms/route-access.ts";

test("getLearnerLmsRedirectPath hides the LMS overview for medewerkers behind Academy", () => {
  assert.equal(getLearnerLmsRedirectPath("MEDEWERKER"), "/academy");
});

test("getLearnerLmsRedirectPath maps medewerker course routes to the matching Academy course route", () => {
  assert.equal(
    getLearnerLmsRedirectPath("MEDEWERKER", { courseSlug: "fy-fit-consultvoering-basis" }),
    "/academy/fy-fit-consultvoering-basis",
  );
});

test("getLearnerLmsRedirectPath maps medewerker lesson routes to the matching Academy lesson route", () => {
  assert.equal(
    getLearnerLmsRedirectPath("MEDEWERKER", {
      courseSlug: "fy-fit-consultvoering-basis",
      lessonSlug: "eerste-consult-opbouw",
    }),
    "/academy/fy-fit-consultvoering-basis/lessons/eerste-consult-opbouw",
  );
});

test("getLearnerLmsRedirectPath keeps LMS routes available for teamleiders and beheerders", () => {
  assert.equal(getLearnerLmsRedirectPath("TEAMLEIDER"), null);
  assert.equal(getLearnerLmsRedirectPath("BEHEERDER", { courseSlug: "fy-fit-consultvoering-basis" }), null);
});
