import { expect, type Page, test } from "@playwright/test";

import {
  cleanupE2ECourses,
  countCourseEvidenceForUser,
  createAudienceVisibilityCourses,
  createBrokenPublishGateCourse,
  disconnectPrisma,
  ensureAudienceE2EAccounts,
  ensureRoleE2EAccount,
  getAudienceAccount,
  getRoleAccount,
  getSeedCourseFixture,
  resetLearnerCourseEvidence,
} from "./support/lms-accreditation-fixtures";

test.describe.configure({ mode: "serial" });

async function loginAs(page: Page, account: { email: string; password: string }) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel(/e-?mail/i).fill(account.email);
  await page.getByLabel(/wachtwoord/i).fill(account.password);
  await page.getByRole("button", { name: /inloggen/i }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

test.afterAll(async () => {
  await disconnectPrisma();
});

test("beheerder ziet een echte publish gate op een incomplete accreditatiecursus", async ({ page }) => {
  const admin = getRoleAccount("BEHEERDER");
  await ensureRoleE2EAccount("BEHEERDER");
  const fixture = await createBrokenPublishGateCourse(admin.email);

  try {
    await loginAs(page, admin);
    await page.goto(`/lms/courses/${fixture.id}`);

    await expect(page.getByRole("heading", { name: /Publicatieblokkade/i })).toBeVisible();
    await expect(page.getByText(/Nog \d+ kritieke blokkade/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Publiceer accreditatie-ready/i })).toBeDisabled();
  } finally {
    await cleanupE2ECourses([fixture.id]);
  }
});

test("reviewer bekijkt cursus en toets zonder inschrijving, voortgang, poging, evaluatie of certificaat", async ({ page }) => {
  const reviewer = getRoleAccount("REVIEWER");
  await ensureRoleE2EAccount("REVIEWER");
  const { course, activeVersion, assessment } = await getSeedCourseFixture();
  const assessmentLesson = activeVersion.lessons.find((lesson) => lesson.id === assessment.lessonId);
  if (!assessmentLesson) {
    throw new Error("Assessment lesson missing for reviewer preview E2E test.");
  }

  await resetLearnerCourseEvidence(reviewer.email, course.id);
  const before = await countCourseEvidenceForUser(reviewer.email, course.id);

  await loginAs(page, reviewer);
  await page.goto(`/lms/courses/${course.id}`);

  await expect(page.getByText(/Reviewer-preview/i).first()).toBeVisible();
  await expect(page.getByText(/geen datavervuiling/i)).toBeVisible();
  await expect(page.getByText(/zonder inschrijving, voortgang, toetspogingen, evaluaties of certificaten/i)).toBeVisible();
  await expect(page.getByText(/Toetsblueprint: leerdoelen × modules/i)).toBeVisible();
  await expect(page.getByText(assessment.title).first()).toBeVisible();
  await expect(page.getByText(/Toetsing en evaluatie/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Start toets/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Markeer les als afgerond/i })).toHaveCount(0);

  const after = await countCourseEvidenceForUser(reviewer.email, course.id);
  expect(after).toEqual(before);
});

test("medewerker rondt de Academy-cursus af en opent het certificaat", async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(process.env.E2E_RUN_MUTATING !== "1", "Zet E2E_RUN_MUTATING=1 om deze completion-flow tegen de gekozen testdatabase te draaien.");

  const learner = getRoleAccount("MEDEWERKER");
  await ensureRoleE2EAccount("MEDEWERKER");
  const { course, activeVersion, assessment } = await getSeedCourseFixture();
  const assessmentLesson = activeVersion.lessons.find((lesson) => lesson.id === assessment.lessonId);
  if (!assessmentLesson) {
    throw new Error("Assessment lesson missing for learner completion E2E test.");
  }

  await resetLearnerCourseEvidence(learner.email, course.id);

  try {
    await loginAs(page, learner);
    await page.goto(`/academy/${course.slug}`);
    await page.getByRole("button", { name: /Start e-learning|Start cursus/i }).click();

    for (const lesson of activeVersion.lessons.filter((entry) => entry.type !== "ASSESSMENT" && entry.isRequired)) {
      await page.goto(`/academy/${course.slug}/lessons/${lesson.slug}`);
      const completeButton = page.getByRole("button", { name: /Markeer les als afgerond/i });
      if (await completeButton.isVisible()) {
        await completeButton.click();
        await expect(page.getByText(/Les afgerond|COMPLETED/i).first()).toBeVisible();
      }
    }

    await page.goto(`/academy/${course.slug}/lessons/${assessmentLesson.slug}`);
    await page.getByRole("button", { name: /Start toets/i }).click();
    await expect(page.getByText(/Actieve poging/i)).toBeVisible();

    for (const question of assessment.questions) {
      const correctOptions = question.options.filter((option) => option.isCorrect);
      for (const option of correctOptions) {
        await page.getByLabel(option.label, { exact: true }).check();
      }
    }

    await page.getByRole("button", { name: /Lever toets in/i }).click();
    await expect(page.getByText(/volledig afgerond|certificaat is gekoppeld/i)).toBeVisible();

    await page.goto(`/academy/${course.slug}`);
    await expect(page.getByText(/afgerond|compleet/i).first()).toBeVisible();
    await page.goto("/academy/certificates");
    await expect(page.getByText(course.title).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Open \/ print bewijs/i }).first()).toBeVisible();
    await page.getByRole("link", { name: /Open \/ print bewijs/i }).first().click();
    await expect(page.getByText(/Certificaat|Deelnamebewijs/i).first()).toBeVisible();
  } finally {
    await resetLearnerCourseEvidence(learner.email, course.id);
  }
});

test("FYSIO, PO en FITCOACH zien alleen hun doelgroepgerichte e-learning", async ({ page }) => {
  const admin = getRoleAccount("BEHEERDER");
  await ensureAudienceE2EAccounts();
  const courses = await createAudienceVisibilityCourses(admin.email);

  try {
    for (const audienceProfile of ["FYSIOTHERAPEUT", "PRAKTIJKONDERSTEUNER", "FITCOACH"] as const) {
      const account = getAudienceAccount(audienceProfile);
      await loginAs(page, account);
      await page.goto("/academy");

      for (const course of courses) {
        const title = page.getByText(course.title, { exact: true });
        if (course.audienceProfile === audienceProfile) {
          await expect(title).toBeVisible();
        } else {
          await expect(title).toHaveCount(0);
        }
      }
    }
  } finally {
    await cleanupE2ECourses(courses.map((course) => course.id));
  }
});

test("beheerder downloadt PE-online CSV-export met 4-weken aanleverstatus", async ({ page }) => {
  const admin = getRoleAccount("BEHEERDER");
  await ensureRoleE2EAccount("BEHEERDER");
  const { course } = await getSeedCourseFixture();

  await loginAs(page, admin);
  await page.goto(`/lms/courses/${course.id}`);

  await expect(page.getByRole("link", { name: /Download PE-online CSV/i })).toBeVisible();
  await expect(page.getByText(/binnen 4 weken/i)).toBeVisible();

  const response = await page.request.get(`/lms/courses/${course.id}/participant-report/pe-online-csv`);
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("text/csv");
  expect(response.headers()["content-disposition"]).toContain("pe-online");

  const body = await response.text();
  expect(body.split("\n")[0]).toBe(
    "accreditationActivityId,firstName,lastName,bigNumber,completionDate,validForSubmission,submissionDeadline",
  );
});
