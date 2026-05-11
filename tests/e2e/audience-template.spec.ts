import { expect, type Page, test } from "@playwright/test";

import {
  audienceAccessMatrix,
  getConfiguredAudienceAccounts,
  missingAudienceAccountMessage,
  type AudienceAccount,
} from "./support/role-accounts";

const accounts = getConfiguredAudienceAccounts();

test.skip(accounts.length === 0, missingAudienceAccountMessage());

async function loginAs(page: Page, account: AudienceAccount) {
  await page.goto("/login");
  await page.getByLabel(/e-?mail/i).fill(account.email);
  await page.getByLabel(/wachtwoord/i).fill(account.password);
  await page.getByRole("button", { name: /inloggen/i }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

async function expectRouteAllowed(page: Page, route: string) {
  await page.goto(route);
  await expect(page).not.toHaveURL(/\/login$/);
  await expectNotificationFeed(page);
}

async function expectAnyDashboardText(page: Page, matcher: RegExp) {
  await expect(page.locator("main").getByText(matcher).first()).toBeVisible();
}

async function expectNotificationFeed(page: Page) {
  await expect(page.getByText("Nieuws & signalen", { exact: true })).toBeVisible();
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

test.describe("ingelogde doelgroepkliktests", () => {
  for (const account of accounts) {
    const expectation = audienceAccessMatrix[account.audienceProfile];

    test(`${expectation.label}: Academy en ontwikkeling passen bij doelgroep`, async ({ page }) => {
      await loginAs(page, account);

      await expectNotificationFeed(page);
      await expectAnyDashboardText(page, expectation.requiredText[0]);

      for (const route of expectation.allowedRoutes) {
        await expectRouteAllowed(page, route);
      }
    });

    for (const route of expectation.forbiddenRoutes) {
      test(`${expectation.label}: ${route} blijft buiten doelgroepflow`, async ({ page }) => {
        await loginAs(page, account);
        await expectRouteForbiddenOrRedirected(page, route);
      });
    }
  }
});
