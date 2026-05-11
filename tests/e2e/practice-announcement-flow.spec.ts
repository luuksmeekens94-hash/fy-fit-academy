import { expect, type Page, test } from "@playwright/test";

import { getConfiguredRoleAccounts, type RoleAccount } from "./support/role-accounts";

const canMutate = process.env.E2E_RUN_MUTATING === "1";
const publisherAccount = getConfiguredRoleAccounts().find((account) =>
  ["PRAKTIJKMANAGER", "PRAKTIJKHOUDER", "BEHEERDER"].includes(account.role),
);

test.skip(!canMutate || !publisherAccount, "Zet E2E_RUN_MUTATING=1 plus een praktijkmanager/praktijkhouder/beheerder testaccount om echte publicatieflow te testen.");

async function loginAs(page: Page, account: RoleAccount) {
  await page.goto("/login");
  await page.getByLabel(/e-?mail/i).fill(account.email);
  await page.getByLabel(/wachtwoord/i).fill(account.password);
  await page.getByRole("button", { name: /inloggen/i }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

test("praktijkbeheer kan een mededeling publiceren en terugzien", async ({ page }) => {
  const title = `E2E praktijkupdate ${Date.now()}`;

  await loginAs(page, publisherAccount!);
  await page.goto("/praktijkbeheer");

  await page.getByPlaceholder("Titel mededeling").fill(title);
  await page.getByRole("combobox").first().selectOption("IMPORTANT");
  await page.getByPlaceholder("Kernboodschap, actie en waar het team meer informatie vindt").fill(
    "Automatische browsercheck: publicatieflow, opslag en melding zonder handmatig klikwerk.",
  );
  await page.getByRole("button", { name: /publiceren \+ melden/i }).click();

  await expect(page.getByRole("article").getByText(title)).toBeVisible();
  await expect(page.getByText(/live/i).first()).toBeVisible();
});
