import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  audienceAccessMatrix,
  getConfiguredAudienceAccounts,
  getConfiguredRoleAccounts,
  roleAccessMatrix,
} from "../e2e/support/role-accounts";

describe("E2E role and audience account configuration", () => {
  it("bouwt alleen rolaccounts als e-mail en wachtwoord allebei aanwezig zijn", () => {
    const accounts = getConfiguredRoleAccounts({
      E2E_MEDEWERKER_EMAIL: "medewerker@example.test",
      E2E_MEDEWERKER_PASSWORD: "secret",
      E2E_TEAMLEIDER_EMAIL: "teamleider@example.test",
      E2E_PRAKTIJKMANAGER_PASSWORD: "missing-email",
    });

    assert.deepEqual(accounts.map((account) => account.role), ["MEDEWERKER"]);
    assert.equal(accounts[0]?.email, "medewerker@example.test");
  });

  it("bouwt alleen doelgroepaccounts als e-mail en wachtwoord allebei aanwezig zijn", () => {
    const accounts = getConfiguredAudienceAccounts({
      E2E_FYSIOTHERAPEUT_EMAIL: "fysio@example.test",
      E2E_FYSIOTHERAPEUT_PASSWORD: "secret",
      E2E_PRAKTIJKONDERSTEUNER_EMAIL: "po@example.test",
      E2E_FITCOACH_PASSWORD: "missing-email",
    });

    assert.deepEqual(accounts.map((account) => account.audienceProfile), ["FYSIOTHERAPEUT"]);
    assert.equal(accounts[0]?.email, "fysio@example.test");
  });

  it("legt per rol de belangrijkste toegestane en verboden routes vast", () => {
    const medewerker = roleAccessMatrix.MEDEWERKER;
    const beheerder = roleAccessMatrix.BEHEERDER;
    const praktijkmanager = roleAccessMatrix.PRAKTIJKMANAGER;

    assert.ok(medewerker.allowedRoutes.includes("/academy"));
    assert.ok(medewerker.forbiddenRoutes.includes("/praktijkbeheer"));
    assert.ok(medewerker.forbiddenRoutes.includes("/academybeheer"));

    assert.ok(beheerder.allowedRoutes.includes("/academybeheer"));
    assert.ok(praktijkmanager.allowedRoutes.includes("/praktijkbeheer"));
    assert.ok(praktijkmanager.forbiddenRoutes.includes("/academy"));
  });

  it("legt doelgroepvarianten vast naast rollen", () => {
    const fysiotherapeut = audienceAccessMatrix.FYSIOTHERAPEUT;
    const praktijkondersteuner = audienceAccessMatrix.PRAKTIJKONDERSTEUNER;
    const fitcoach = audienceAccessMatrix.FITCOACH;

    assert.ok(fysiotherapeut.allowedRoutes.includes("/academy"));
    assert.ok(praktijkondersteuner.allowedRoutes.includes("/academy"));
    assert.ok(fitcoach.allowedRoutes.includes("/academy"));

    assert.ok(fysiotherapeut.forbiddenRoutes.includes("/praktijkbeheer"));
    assert.ok(praktijkondersteuner.forbiddenRoutes.includes("/academybeheer"));
    assert.ok(fitcoach.forbiddenRoutes.includes("/admin"));
  });
});
