import { expect, test } from "@playwright/test";

const protectedRoutes = ["/academybeheer", "/praktijkbeheer"];

test.describe("protected management routes", () => {
  for (const route of protectedRoutes) {
    test(`${route} stuurt anonieme bezoekers naar login`, async ({ page }) => {
      await page.goto(route);

      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole("heading", { name: /inloggen/i })).toBeVisible();
    });
  }
});

test("loginpagina is bestuurbaar met browser harness", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: /inloggen/i })).toBeVisible();
  await page.getByLabel(/e-?mail/i).fill("[REDACTED]@example.test");
  await page.getByLabel(/wachtwoord/i).fill("[REDACTED]");

  await expect(page.getByRole("button", { name: /inloggen/i })).toBeEnabled();
});
