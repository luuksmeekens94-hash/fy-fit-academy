import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const roleStartRoutes = [
  process.env.E2E_MEDEWERKER_ROUTE ?? "/academy",
  process.env.E2E_TEAMLEIDER_ROUTE ?? "/team",
  process.env.E2E_PRAKTIJKMANAGER_ROUTE ?? "/praktijkbeheer",
  process.env.E2E_PRAKTIJKHOUDER_ROUTE ?? "/praktijkbeheer",
  process.env.E2E_BEHEERDER_ROUTE ?? "/academybeheer",
  process.env.E2E_REVIEWER_ROUTE ?? "/academybeheer",
];

test.skip(!email || !password, "Zet E2E_EMAIL en E2E_PASSWORD lokaal/CI om ingelogd te klikken zonder secrets te committen.");

test.describe("authenticated browser harness", () => {
  test("kan met testaccount inloggen en basisroutes aanklikken", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/e-?mail/i).fill(email!);
    await page.getByLabel(/wachtwoord/i).fill(password!);
    await page.getByRole("button", { name: /inloggen/i }).click();

    await expect(page).not.toHaveURL(/\/login$/);

    for (const route of [...new Set(roleStartRoutes)]) {
      await page.goto(route);
      await expect(page).not.toHaveURL(/\/login$/);
    }
  });
});
