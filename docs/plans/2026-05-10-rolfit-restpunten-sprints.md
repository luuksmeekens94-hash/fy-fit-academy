# Rolfit Restpunten Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Werk de drie resterende rolfit-gaten af: praktijkhouder-dashboard practice-first, praktijkmanager operationeel beheer/rapportage, en volwassen Academy-admin cockpit.

**Architecture:** Houd rechten centraal in `src/lib/roles.ts` en bouw nieuwe productlogica eerst als pure helpers onder `src/lib/**` met tests. Daarna pas UI aansluiten in bestaande App Router-routes onder `src/app/(protected)`. Geen nieuwe rechtenrollen tenzij nodig; onderscheid rechtenrol en doelgroep blijft intact.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma 7/PostgreSQL, Node test runner, TypeScript, Tailwind CSS.

---

## Sprintoverzicht

### Sprint 1 — Praktijkhouder-dashboard practice-first

**Doel:** Het praktijkhouderdashboard moet primair voelen als “Hoe staat de praktijk ervoor?”, met eigen Academy/LMS en certificaten aanwezig maar secundair.

**Scope:**
- Practice-first dashboardcopy en primaire stats voor `PRAKTIJKHOUDER`.
- Eigen LMS niet verwijderen, maar niet meer als eerste dashboardmetric tonen.
- Quick links richten op praktijkmonitor, teamdetail/ontwikkelsignalen, rapportage/bibliotheek en eigen certificaten als secundaire link.
- Tests voor copy/stats/intent.

**Niet in scope:** Nieuwe databasevelden, nieuwe managementrapportages, mededelingenbeheer.

### Sprint 2 — Praktijkmanager operationeel beheer en rapportagebasis

**Doel:** Praktijkmanager krijgt naast monitoring een praktische werklaag voor gesprekken, deadlines, mededelingen en rapportage/export, zonder eigen LMS.

**Scope:**
- Pure helper voor praktijkmanagement-overzicht: gesprekssignalen, onboarding deadlines, open modules, team/person filters.
- UI-sectie op praktijkmonitor met “Aandacht nodig”, “Gespreksplanning”, “Deadlines”, “Rapportage/export”.
- CSV/Markdown exporthelper voor praktijkmonitorbasis, server-side guarded voor `PRAKTIJKMANAGER`, `PRAKTIJKHOUDER`, `BEHEERDER`.
- Mededelingen/deadlinebeheer eerst als admin/beheerbare content als bestaande data dat toelaat; anders expliciet lightweight statische planningkaart zonder fake persistence.

**Niet in scope:** Volledig agenda-/HR-systeem, gevoelige strategische instellingen.

### Sprint 3 — Academy-admin volwassen beheer/cockpit

**Doel:** Beheerder krijgt een duidelijkere Academy-admin cockpit voor content, toetsing, evaluatie, accreditatie en publicatiekwaliteit.

**Scope:**
- Admin cockpit opdelen in overzichtssecties: Content, Toetsvragen, Evaluaties, Accreditatie, Reviewer, Certificaten, Gebruikers, Publicatie.
- Pure readiness helper die per cursus/checklist status en blockers samenvat.
- UI voor accreditatiecockpit met bestaande LMS-evidence, reviewer-preview link, participant-report/exportlinks.
- Toetsvragen/evaluaties minimaal als beheerbare/readable cockpit als schema al bestaat; anders duidelijke “nog te bouwen” status met pad naar data/model.

**Niet in scope:** Grote schema-herbouw of volledige CourseFlow-clone in één sprint.

---

## Sprint 1 taken — Praktijkhouder-dashboard practice-first

### Task 1: Voeg pure dashboard-intent helper toe

**Objective:** Maak testbare dashboardrolbeslissingen buiten de page-component.

**Files:**
- Create: `src/lib/dashboard-role-fit.ts`
- Create/modify: `tests/lib/dashboard-role-fit.test.ts`

**Step 1: Write failing test**

Testcases:
- `PRAKTIJKHOUDER` krijgt `primaryMode: "PRACTICE"` ondanks persoonlijke LMS-toegang.
- `PRAKTIJKHOUDER` krijgt title/description rond praktijkgezondheid.
- `MEDEWERKER` en `TEAMLEIDER` blijven personal-first.
- `PRAKTIJKMANAGER` blijft practice-first zonder personal LMS.

**Step 2: Run test to verify failure**

Run: `node --import tsx --test tests/lib/dashboard-role-fit.test.ts`
Expected: FAIL omdat helper nog niet bestaat.

**Step 3: Implement minimal helper**

Export functies/types:
- `getDashboardRoleFit(role, firstName, audienceProfile)`
- `DashboardPrimaryMode = "PERSONAL" | "TEAM" | "PRACTICE" | "ADMIN" | "REVIEW"`

**Step 4: Run test to verify pass**

Run: `node --import tsx --test tests/lib/dashboard-role-fit.test.ts`
Expected: PASS.

### Task 2: Gebruik helper in hoofddashboard

**Objective:** Voorkom dat `hasPersonalLms` bij praktijkhouder de eerste stat/CTA kaapt.

**Files:**
- Modify: `src/app/(protected)/page.tsx`
- Test: `tests/lib/dashboard-role-fit.test.ts`

**Step 1: Write failing assertions**

Voeg helperasserties toe voor praktijkhouder metrics:
- eerste stat label bevat `Praktijkleden` of `Praktijk in beeld`, niet `Openstaande e-learnings`.
- secundaire personal LMS CTA blijft beschikbaar.

**Step 2: Run test to verify failure**

Run: `node --import tsx --test tests/lib/dashboard-role-fit.test.ts`
Expected: FAIL.

**Step 3: Wire helper into page**

Gebruik `dashboardRoleFit` om:
- dashboardcopy te kiezen
- stat labels/details te kiezen
- praktijkhouder quick links practice-first te tonen
- Academy kaart lager/secundair te laten bestaan

**Step 4: Run tests**

Run: `node --import tsx --test tests/lib/dashboard-role-fit.test.ts tests/lib/roles.test.ts`
Expected: PASS.

### Task 3: Polish praktijkhouder UI-copy

**Objective:** Maak de taal expliciet managementgericht zonder persoonlijke ontwikkeling te pushen.

**Files:**
- Modify: `src/app/(protected)/page.tsx`
- Maybe modify: `src/lib/dashboard-role-fit.ts`

**Acceptance:**
- Header: praktijkgezondheid/praktijkoverzicht.
- Cards: onboarding, modules, doelen/signalen, gesprekstukken.
- Eigen certificaten/Academy zichtbaar maar niet dominant.

### Task 4: Validate and commit Sprint 1

Run:
- `node --import tsx --test tests/lib/dashboard-role-fit.test.ts tests/lib/roles.test.ts tests/lib/lms/route-access.test.ts`
- `npm run lint`
- `npm run build`

Commit:
- `feat: make practice owner dashboard practice-first`

---

## Sprint 2 taken — Praktijkmanager operationeel beheer en rapportagebasis

### Task 1: Bouw practice-monitor summary helper

**Files:**
- Create: `src/lib/practice-monitor/summary.ts`
- Create: `tests/lib/practice-monitor/summary.test.ts`

**Behavior:**
- Berekent actieve praktijkleden, onboarding actief, open ontwikkeldoelen, module completion, aandacht nodig.
- Onderscheidt practice-wide viewer van teamleider.

### Task 2: Bouw exporthelper

**Files:**
- Create: `src/lib/practice-monitor/export.ts`
- Create: `tests/lib/practice-monitor/export.test.ts`

**Behavior:**
- CSV en Markdown voor praktijkmonitorregels.
- Geen persoonsgegevens buiten bestaande zichtbare uservelden.
- Expliciet labels voor ontbrekende waarden.

### Task 3: Voeg routeguarded exportroute toe

**Files:**
- Create: `src/app/(protected)/team/export/[format]/route.ts`

**Guard:**
- Alleen `PRAKTIJKMANAGER`, `PRAKTIJKHOUDER`, `BEHEERDER`.

### Task 4: Breid praktijkmonitor UI uit

**Files:**
- Modify: `src/app/(protected)/team/page.tsx`
- Maybe modify: `src/app/(protected)/page.tsx`

**UI:**
- Aandacht nodig
- Gespreksplanning
- Deadlines
- Exportknoppen
- Mededelingen als zichtbaar blok, geen fake beheer als data ontbreekt.

### Task 5: Validate and commit Sprint 2

Run focused tests, lint, build. Commit:
- `feat: add practice manager operations layer`

---

## Sprint 3 taken — Academy-admin volwassen cockpit

### Task 1: Bouw admin cockpit summary helper

**Files:**
- Create: `src/lib/admin/academy-cockpit.ts`
- Create: `tests/lib/admin/academy-cockpit.test.ts`

**Behavior:**
- Contentstatus, accreditatievelden, certificaatbewijs, reviewer-preview, exports, publicatiestatus.
- Statussen: `OK`, `AANDACHT`, `ONTBREEKT`.

### Task 2: Maak admin cockpit UI bovenaan adminpagina

**Files:**
- Modify: `src/app/(protected)/admin/page.tsx`

**UI:**
- Content beheren
- Toetsvragen
- Evaluaties
- Accreditatiecockpit
- Reviewer-preview
- Certificaten/rapportage
- Publiceren/archiveren

### Task 3: Maak accreditatie/detailsectie exportvriendelijk

**Files:**
- Reuse: `src/components/lms/accreditation-panel.tsx`
- Modify/create helpers if needed.

**Acceptance:**
- Beheerder ziet meteen wat review-/publicatieklaar is.
- Links naar participant reports en evidence zijn duidelijk.

### Task 4: Validate and commit Sprint 3

Run focused tests, lint, build. Commit:
- `feat: add academy admin cockpit`

---

## Eindvalidatie

Na Sprint 3:
- `node --import tsx --test tests/lib/roles.test.ts tests/lib/dashboard-role-fit.test.ts tests/lib/practice-monitor/summary.test.ts tests/lib/practice-monitor/export.test.ts tests/lib/admin/academy-cockpit.test.ts tests/lib/lms/route-access.test.ts tests/lib/lms/reviewer-preview.test.ts tests/lib/lms/certificate-archive.test.ts`
- `npm run lint`
- `npm run build`
- `git status --short --branch`
- Push naar GitHub.
- Productie smoke-check protected routes:
  - `/`
  - `/team`
  - `/team/export/csv`
  - `/admin`
  - `/lms`
  - `/academy/certificates`
