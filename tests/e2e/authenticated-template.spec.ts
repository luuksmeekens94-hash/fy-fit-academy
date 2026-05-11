import { expect, type Page, test } from "@playwright/test";

import {
  getConfiguredRoleAccounts,
  missingRoleAccountMessage,
  roleAccessMatrix,
  type RoleAccount,
} from "./support/role-accounts";

const accounts = getConfiguredRoleAccounts();

test.skip(accounts.length === 0, missingRoleAccountMessage());

async function loginAs(page: Page, account: RoleAccount) {
  await page.goto("/login");
  await page.getByLabel(/e-?mail/i).fill(account.email);
  await page.getByLabel(/wachtwoord/i).fill(account.password);
  await page.getByRole("button", { name: /inloggen/i }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

async function expectRouteAllowed(page: Page, route: string) {
  await page.goto(route);
  await expect(page).not.toHaveURL(/\/login$/);
  await expect(page.getByText(/nieuws & signalen/i)).toBeVisible();
}

async function expectRouteForbiddenOrRedirected(page: Page, route: string) {
  await page.goto(route);

  const currentUrl = new URL(page.url());
  const stayedOnForbiddenRoute = currentUrl.pathname === route;

  if (!stayedOnForbiddenRoute) {
    await expect(page).not.toHaveURL(new RegExp(`${route.replaceAll("/", "\\/")}$`));
    return;
  }

  await expect(page.getByText(/geen toegang|niet bevoegd|unauthorized|forbidden/i)).toBeVisible();
}

test.describe("ingelogde rolkliktests", () => {
  for (const account of accounts) {
    const expectation = roleAccessMatrix[account.role];

    test(`${expectation.label}: dashboard, toegestane routes en notificatielaag`, async ({ page }) => {
      await loginAs(page, account);

      await expect(page.getByText(/nieuws & signalen/i)).toBeVisible();
      await expect(page.getByText(expectation.requiredText[0])).toBeVisible();

      for (const route of expectation.allowedRoutes) {
        await expectRouteAllowed(page, route);
      }
    });

    for (const route of expectation.forbiddenRoutes) {
      test(`${expectation.label}: ${route} is niet rechtstreeks bruikbaar`, async ({ page }) => {
        await loginAs(page, account);
        await expectRouteForbiddenOrRedirected(page, route);
      });
    }
  }
});
