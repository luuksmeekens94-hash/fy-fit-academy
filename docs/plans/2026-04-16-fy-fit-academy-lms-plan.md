# Fy-Fit Academy LMS Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build the first working LMS flow inside Fy-Fit Academy without breaking the existing Academy domains.

**Architecture:** Keep the current Academy domains (`Module`, `Onboarding`, `Document`, `LearningGoal`, `DevelopmentDocument`) intact and add the LMS as a parallel domain built around `Course`, `CourseVersion`, `Lesson`, `Enrollment`, `Assessment`, and `Certificate`. Reuse the current auth/session layer, route protection, Prisma client, and visual design system.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Prisma 7 + PostgreSQL (Neon), Tailwind CSS 4, cookie-based HMAC auth, Vercel deployment.

---

## Current Verified Baseline

- Local repo: `/mnt/c/Users/Luuk Smeekens/fy-fit-academy`
- GitHub repo: `https://github.com/luuksmeekens94-hash/fy-fit-academy`
- Live app: `https://fy-fit-academy.vercel.app`
- Vercel project: `https://vercel.com/luuksmeekens94-6788s-projects/fy-fit-academy`
- Current branch: `main`
- Current remote head: `1cb7bb0 feat: LMS domein - schema, types, queries, scoring, rules, certificates`

### Verified repository state
- The LMS schema/models already exist in `prisma/schema.prisma`
- LMS helper files already exist in `src/lib/lms/`
- LMS pages/routes do **not** exist yet
- LMS actions do **not** exist yet
- Seed data does **not** yet create LMS entities
- `README.md` is outdated compared to the current architecture
- `npm run lint` currently fails with one error in `src/lib/data.ts` due to assigning to a variable named `module`
- `npm run build` currently fails in this WSL setup due to a Prisma engine copy `EPERM` on `/mnt/c/.../node_modules`, so build verification may need either a Linux-native workspace or a safer Prisma engine workaround

---

## Delivery Principles

1. Do not break existing Academy routes.
2. Do not refactor old `Module` pages into LMS pages.
3. Build one complete end-to-end LMS flow before broadening scope.
4. Keep LMS business logic out of UI files.
5. Use role checks consistently:
   - medewerker: own LMS data only
   - teamleider: assigned team only
   - beheerder: all LMS data
6. Prefer small commits after each completed slice.

---

## Phase 0 — Stabilize the working baseline

### Task 0.1: Fix the current lint blocker

**Objective:** Make the repo pass lint before adding more work.

**Files:**
- Modify: `src/lib/data.ts`

**Steps:**
1. Rename the local variable named `module` in the mapper function to `academyModule` or similar.
2. Re-run: `npm run lint`
3. Expected: lint passes or exposes the next real issue.

**Commit:**
```bash
git add src/lib/data.ts
git commit -m "fix: resolve lint issue in data mapper"
```

### Task 0.2: Normalize repository text file endings

**Objective:** Prevent line-ending churn from polluting future diffs.

**Files:**
- Create: `.gitattributes`

**Suggested content:**
```gitattributes
* text=auto
*.ts text eol=lf
*.tsx text eol=lf
*.js text eol=lf
*.mjs text eol=lf
*.json text eol=lf
*.md text eol=lf
*.css text eol=lf
*.prisma text eol=lf
```

**Verification:**
1. Save file.
2. Re-check: `git diff --ignore-space-at-eol --stat`
3. Confirm future diffs are meaningful.

**Commit:**
```bash
git add .gitattributes
git commit -m "chore: normalize line endings for repo text files"
```

### Task 0.3: Refresh project documentation

**Objective:** Bring docs back in sync with the real app state.

**Files:**
- Modify: `README.md`
- Optionally modify: `CLAUDE.md`

**Must include:**
- Prisma-backed architecture instead of old demo-store wording
- existing protected routes
- LMS domain present but UI incomplete
- deployment source of truth = GitHub + Vercel

**Commit:**
```bash
git add README.md CLAUDE.md
git commit -m "docs: sync project documentation with current architecture"
```

---

## Phase 1 — Finish the LMS data foundation

### Task 1.1: Seed LMS domain records

**Objective:** Add one complete demo LMS flow to the database seed.

**Files:**
- Modify: `prisma/seed.ts`

**Seed requirements:**
- 1 published course
- 1 active course version
- 3–5 lessons
- 1 assessment with 5–10 questions
- 2 enrollments
- 1 user in progress
- 1 user completed with certificate
- at least 1 attempt record with answers

**Suggested course:**
- title: `Fy-fit consultvoering basis`
- audience: medewerkers
- study load: ~45–60 min
- lessons: intro, consultstructuur, casus, reflectie, toets

**Verification:**
- `npm run db:seed`
- Inspect DB or add temporary query checks

**Commit:**
```bash
git add prisma/seed.ts
git commit -m "feat: seed first LMS course flow"
```

### Task 1.2: Extend LMS query coverage where needed

**Objective:** Ensure UI can fetch all data needed for the first LMS flow.

**Files:**
- Modify: `src/lib/lms/queries.ts`
- Optionally modify: `src/lib/lms/types.ts`

**Likely additions:**
- `getCourseBySlug` or stable route lookup helper
- `getLessonDetail`
- `getEnrollmentDetailForUser`
- `getLatestPassedAttemptForAssessment`
- `getCertificateForCourseAndUser`

**Rule:** keep Prisma-to-app mapping logic in the LMS domain layer, not in pages.

**Commit:**
```bash
git add src/lib/lms/queries.ts src/lib/lms/types.ts
git commit -m "feat: expand LMS query layer for first end-to-end flow"
```

---

## Phase 2 — Add LMS server actions

### Task 2.1: Create LMS action file

**Objective:** Keep LMS mutations separate from `src/app/actions.ts`.

**Files:**
- Create: `src/app/lms-actions.ts`

**Initial actions:**
- `startEnrollmentAction`
- `completeLessonAction`
- `startAssessmentAttemptAction`
- `submitAssessmentAttemptAction`

**Requirements:**
- Use `requireUser()` / `requireRole()`
- Revalidate LMS routes only
- Reuse `calculateScore`, `isCourseCompleted`, and `issueCertificate`

**Commit:**
```bash
git add src/app/lms-actions.ts
git commit -m "feat: add LMS server actions"
```

### Task 2.2: Wire completion logic after assessment submission

**Objective:** When a user passes all required pieces, complete the enrollment and issue a certificate.

**Files:**
- Modify: `src/app/lms-actions.ts`
- Modify if needed: `src/lib/lms/rules.ts`
- Modify if needed: `src/lib/lms/certificates.ts`

**Flow:**
1. score attempt
2. persist answers + attempt result
3. recalculate course completion state
4. mark enrollment `COMPLETED` when rules pass
5. issue certificate exactly once

**Commit:**
```bash
git add src/app/lms-actions.ts src/lib/lms/rules.ts src/lib/lms/certificates.ts
git commit -m "feat: complete LMS enrollment and certificate flow"
```

---

## Phase 3 — Build medewerker LMS routes

### Task 3.1: Add LMS overview page

**Objective:** Show the logged-in user their assigned LMS courses.

**Files:**
- Create: `src/app/(protected)/lms/page.tsx`
- Optionally create: `src/components/lms/course-card.tsx`
- Optionally create: `src/components/lms/enrollment-status-badge.tsx`

**Page contents:**
- course title
- progress
- assignment type
- deadline
- status
- CTA to open course

**Data source:** `getMyEnrollments(user.id)`

**Commit:**
```bash
git add src/app/(protected)/lms/page.tsx src/components/lms/
git commit -m "feat: add LMS course overview for medewerkers"
```

### Task 3.2: Add course detail page

**Objective:** Show active course version, lessons, assessments, and completion state.

**Files:**
- Create: `src/app/(protected)/lms/courses/[courseId]/page.tsx`
- Create if needed: `src/components/lms/lesson-list.tsx`
- Create if needed: `src/components/lms/progress-bar.tsx`

**Show:**
- course metadata
- active version
- ordered lessons
- lesson completion state
- assessment links/status
- certificate status if completed

**Commit:**
```bash
git add src/app/(protected)/lms/courses/[courseId]/page.tsx src/components/lms/
git commit -m "feat: add LMS course detail page"
```

### Task 3.3: Add lesson detail page

**Objective:** Let the user open a lesson and mark it complete.

**Files:**
- Create: `src/app/(protected)/lms/courses/[courseId]/lessons/[lessonId]/page.tsx`

**Behavior:**
- render lesson content by `LessonType`
- show estimated time
- show complete action for eligible lessons
- after completion, return user to course detail or next lesson

**Commit:**
```bash
git add src/app/(protected)/lms/courses/[courseId]/lessons/[lessonId]/page.tsx
git commit -m "feat: add LMS lesson detail page"
```

### Task 3.4: Add certificates page

**Objective:** Give users a dedicated LMS certificates history view.

**Files:**
- Create: `src/app/(protected)/lms/certificates/page.tsx`
- Optionally create: `src/components/lms/certificate-card.tsx`

**Data source:** `getMyCertificates(user.id)`

**Commit:**
```bash
git add src/app/(protected)/lms/certificates/page.tsx src/components/lms/
git commit -m "feat: add LMS certificates overview"
```

---

## Phase 4 — Build assessment flow

### Task 4.1: Add assessment page

**Objective:** Render an assessment for a logged-in user.

**Files:**
- Create: `src/app/(protected)/lms/courses/[courseId]/assessment/[assessmentId]/page.tsx`
- Create: `src/components/lms/assessment-runner.tsx`
- Create: `src/components/lms/assessment-question.tsx`

**Requirements:**
- support `MULTIPLE_CHOICE`
- support `MULTIPLE_RESPONSE`
- support `TRUE_FALSE`
- gracefully defer `OPEN_TEXT`
- show remaining attempts
- submit to `submitAssessmentAttemptAction`

**Commit:**
```bash
git add src/app/(protected)/lms/courses/[courseId]/assessment/[assessmentId]/page.tsx src/components/lms/
git commit -m "feat: add LMS assessment runner"
```

### Task 4.2: Add result state and feedback

**Objective:** Show pass/fail outcome and next step.

**Files:**
- Modify: `src/app/(protected)/lms/courses/[courseId]/assessment/[assessmentId]/page.tsx`
- Modify: `src/components/lms/assessment-runner.tsx`

**Behavior:**
- score shown after submit
- pass/fail status shown clearly
- feedback obeys assessment settings where practical for MVP
- CTA back to course page

**Commit:**
```bash
git add src/app/(protected)/lms/courses/[courseId]/assessment/[assessmentId]/page.tsx src/components/lms/assessment-runner.tsx
git commit -m "feat: add LMS assessment results and feedback"
```

---

## Phase 5 — Build admin LMS views

### Task 5.1: Add admin LMS dashboard

**Objective:** Give beheerders a dedicated LMS area without overloading the existing admin page.

**Files:**
- Create: `src/app/(protected)/lms/admin/page.tsx`
- Create: `src/app/(protected)/lms/admin/courses/page.tsx`
- Create: `src/app/(protected)/lms/admin/courses/[courseId]/page.tsx`

**Show:**
- total courses
- published vs concept
- enrollment totals
- completion totals
- list of courses

**Commit:**
```bash
git add src/app/(protected)/lms/admin/
git commit -m "feat: add LMS admin dashboard and course pages"
```

### Task 5.2: Add simple reporting view

**Objective:** Surface MVP reporting from existing LMS queries.

**Files:**
- Create: `src/app/(protected)/lms/admin/reports/page.tsx`

**Report slices:**
- enrollments per course
- completed per course
- pass/fail counts
- average score where available

**Commit:**
```bash
git add src/app/(protected)/lms/admin/reports/page.tsx
git commit -m "feat: add LMS admin reports page"
```

---

## Phase 6 — Build teamleider LMS views

### Task 6.1: Add team LMS overview

**Objective:** Let teamleiders see LMS progress for their team.

**Files:**
- Create: `src/app/(protected)/lms/team/page.tsx`
- Optionally create: `src/app/(protected)/lms/team/[userId]/page.tsx`

**Data source:** `getTeamLmsProgress(viewer.id)`

**Show:**
- team member
- assigned courses
- deadline
- status
- completedAt

**Commit:**
```bash
git add src/app/(protected)/lms/team/
git commit -m "feat: add LMS team progress pages"
```

---

## Phase 7 — Navigation and UX integration

### Task 7.1: Add LMS navigation entry

**Objective:** Make LMS discoverable inside the protected shell.

**Files:**
- Modify: `src/components/app-shell.tsx`
- Modify if needed: `src/components/nav-link.tsx`

**Rules:**
- medewerkers see LMS
- teamleiders see LMS + team views
- beheerders see LMS + admin views

**Commit:**
```bash
git add src/components/app-shell.tsx src/components/nav-link.tsx
git commit -m "feat: add LMS navigation"
```

### Task 7.2: Keep visual language aligned

**Objective:** Match the current Academy look and feel.

**Files:**
- Modify or create LMS components under `src/components/lms/`
- Modify `src/app/globals.css` only if truly needed

**Rule:** no new visual design system; reuse existing page headers, cards, badges, and spacing rhythm.

**Commit:**
```bash
git add src/components/lms src/app/globals.css
git commit -m "style: align LMS UI with Academy design system"
```

---

## Testing and Verification Checklist

After each phase:

### Minimum checks
```bash
npm run lint
```

### Database checks
```bash
npm run db:generate
npm run db:seed
```

### Runtime checks
```bash
npm run dev
```

### Manual verification path
1. login as medewerker
2. open `/lms`
3. open a course
4. complete at least one lesson
5. take an assessment
6. complete the course
7. confirm certificate appears
8. login as teamleider and inspect team LMS progress
9. login as beheerder and inspect LMS admin pages

### Deployment path
After validated changes:
```bash
git status
git add .
git commit -m "feat: <completed LMS slice>"
git push origin main
```

Expected deploy path:
- GitHub receives push on `main`
- Vercel auto-deploys from the connected repository
- Verify production on `https://fy-fit-academy.vercel.app`

---

## First Recommended Execution Order

If implementation starts immediately, do this exact order:

1. fix lint blocker in `src/lib/data.ts`
2. add `.gitattributes`
3. update `README.md`
4. extend `prisma/seed.ts` with LMS records
5. add missing LMS queries/types
6. add `src/app/lms-actions.ts`
7. add `/lms` page
8. add `/lms/courses/[courseId]`
9. add lesson page
10. add assessment page
11. add certificate page
12. add `/lms/admin`
13. add `/lms/team`
14. wire navigation
15. validate locally
16. commit + push + verify Vercel deploy

---

## Notes for Hermes

- Treat GitHub `main` as the deploy branch unless Sjoerd says otherwise.
- Avoid broad refactors in the old Academy domain while LMS is still being established.
- If build continues to fail because of `/mnt/c` Prisma engine permissions, consider moving active implementation into a Linux-native working copy under the WSL home directory and then pushing from there.
- The existing LMS files in `src/lib/lms/` are the canonical starting point; do not duplicate that logic into page components.
