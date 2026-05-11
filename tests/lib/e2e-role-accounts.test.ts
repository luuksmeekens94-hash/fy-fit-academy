import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getConfiguredRoleAccounts, roleAccessMatrix } from "../e2e/support/role-accounts";

describe("E2E role account configuration", () => {
  it("bouwt alleen accounts als e-mail en wachtwoord allebei aanwezig zijn", () => {
    const accounts = getConfiguredRoleAccounts({
      E2E_MEDEWERKER_EMAIL: "medewerker@example.test",
      E2E_MEDEWERKER_PASSWORD: "secret",
      E2E_TEAMLEIDER_EMAIL: "teamleider@example.test",
      E2E_PRAKTIJKMANAGER_PASSWORD: "missing-email",
    });

    assert.deepEqual(accounts.map((account) => account.role), ["MEDEWERKER"]);
    assert.equal(accounts[0]?.email, "medewerker@example.test");
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
});
