# Rolgestuurde dashboards & teamstructuur Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Bouw één Fy-Fit Academy met rolgestuurde dashboards waarin medewerkers hun eigen leer-/ontwikkelomgeving hebben, teamleiders daarnaast hun team monitoren, praktijkhouder/Sjoerd praktijkbreed monitort mét eigen LMS, praktijkmanager praktijkbreed monitort zónder eigen LMS, en Academy-admins de LMS/Academy beheren.

**Architecture:** We houden één applicatie en één auth-flow, maar splitsen dashboard, navigatie en datatoegang op via expliciete rollen en permissiehelpers. De bestaande rollen `MEDEWERKER`, `TEAMLEIDER`, `BEHEERDER`, `REVIEWER` worden uitgebreid met `PRAKTIJKMANAGER` en `PRAKTIJKHOUDER`; teamtoegang loopt via bestaande `teamleaderId` en later eventueel een echte `Team`-tabel. UI wordt opgebouwd uit herbruikbare dashboardpanelen in plaats van één groeiend dashboard.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7, PostgreSQL/Neon, Tailwind CSS 4, cookie/HMAC auth.

---

## 1. Uitgangspunten

### Productprincipes

- Eén Academy, meerdere rollen.
- Geen aparte apps of losse loginflows.
- Dashboard toont per rol alleen relevante blokken.
- Datatoegang wordt server-side afgedwongen; UI-verbergen alleen is onvoldoende.
- Praktijkhouder en praktijkmanager lijken op elkaar, maar verschillen bewust op LMS-toegang.
- Teamleider heeft een dubbele identiteit: eigen medewerkeromgeving én teamleideromgeving.
- Beheerder/Academy-admin is primair voor inhoud, LMS, accreditatie en gebruikersbeheer.

### Rolgedrag in één zin

- **Medewerker:** “Wat staat er voor mij klaar?”
- **Teamleider:** “Wat staat er voor mij klaar én hoe gaat het met mijn team?”
- **Praktijkhouder/Sjoerd:** “Hoe staat de hele praktijk ervoor, en welke e-learnings volg ik zelf?”
- **Praktijkmanager:** “Wat moet operationeel opgevolgd worden in de praktijk, zonder eigen LMS-laag?”
- **Academy-admin/Beheerder:** “Hoe beheer ik de Academy, content, accreditatie, gebruikers en rapportages?”
- **Reviewer:** “Hoe controleer ik LMS/accreditatie zonder echte voortgang te vervuilen?”

---

## 2. Definitieve rollen

### Prisma enum `Role`

Huidig:

```prisma
enum Role {
  MEDEWERKER
  TEAMLEIDER
  BEHEERDER
  REVIEWER
}
```

Gewenst:

```prisma
enum Role {
  MEDEWERKER
  TEAMLEIDER
  PRAKTIJKMANAGER
  PRAKTIJKHOUDER
  BEHEERDER
  REVIEWER
}
```

### TypeScript type `Role`

Aanpassen in `src/lib/types.ts` naar:

```ts
export type Role =
  | "MEDEWERKER"
  | "TEAMLEIDER"
  | "PRAKTIJKMANAGER"
  | "PRAKTIJKHOUDER"
  | "BEHEERDER"
  | "REVIEWER";
```

### Rolgroepen

Maak centrale rolhelpers in `src/lib/roles.ts`:

```ts
import type { Role } from "@/lib/types";

export const PERSONAL_LMS_ROLES: Role[] = ["MEDEWERKER", "TEAMLEIDER", "PRAKTIJKHOUDER"];
export const PERSONAL_DEVELOPMENT_ROLES: Role[] = ["MEDEWERKER", "TEAMLEIDER"];
export const TEAM_MONITOR_ROLES: Role[] = ["TEAMLEIDER"];
export const PRACTICE_MONITOR_ROLES: Role[] = ["PRAKTIJKMANAGER", "PRAKTIJKHOUDER", "BEHEERDER"];
export const ACADEMY_ADMIN_ROLES: Role[] = ["BEHEERDER"];
export const REVIEWER_ROLES: Role[] = ["REVIEWER"];

export function hasRole(role: Role, roles: Role[]) {
  return roles.includes(role);
}

export function canUsePersonalLms(role: Role) {
  return hasRole(role, PERSONAL_LMS_ROLES);
}

export function canUsePersonalDevelopment(role: Role) {
  return hasRole(role, PERSONAL_DEVELOPMENT_ROLES);
}

export function canMonitorOwnTeam(role: Role) {
  return role === "TEAMLEIDER";
}

export function canMonitorPractice(role: Role) {
  return hasRole(role, PRACTICE_MONITOR_ROLES);
}

export function canManageAcademy(role: Role) {
  return hasRole(role, ACADEMY_ADMIN_ROLES);
}
```

---

## 3. Rechtenmatrix

### Medewerker

**Mag zien/gebruiken:**

- Eigen dashboard
- Eigen LMS/e-learnings
- Eigen onboarding
- Eigen ontwikkeling
- Eigen doelen
- Eigen documenten/gespreksverslagen
- Eigen certificaten/deelnamebewijzen
- Praktijkbibliotheek
- Mijn gegevens

**Mag niet zien:**

- Teamoverzichten
- Gegevens van collega’s
- Praktijkbrede rapportages
- Academy-adminbeheer

### Teamleider

**Mag zien/gebruiken:**

Eigen omgeving:

- Eigen dashboard
- Eigen LMS/e-learnings
- Eigen onboarding
- Eigen ontwikkeling
- Eigen doelen
- Eigen documenten
- Eigen certificaten
- Praktijkbibliotheek

Teamleideromgeving:

- Eigen teamdashboard
- Teamledenoverzicht
- Voortgang per therapeut in eigen team
- Onboardingstatus per teamlid
- E-learningstatus per teamlid
- Ontwikkeldoelen per teamlid
- Gespreksdocumenten toevoegen bij teamleden
- Signalen: achterstand, open doelen, komende gesprekken

**Mag niet zien:**

- Andere teams
- Praktijkbrede managementrapportage
- Academy-adminbeheer, tenzij gebruiker ook `BEHEERDER` is in een later multi-role model

### Praktijkhouder / Sjoerd

**Mag zien/gebruiken:**

Eigen laag:

- Eigen LMS/e-learnings
- Eigen certificaten/deelnamebewijzen
- Praktijkbibliotheek
- Mijn gegevens

Monitorlaag:

- Praktijkdashboard
- Alle teams
- Alle therapeuten
- Voortgang LMS/onboarding per persoon
- Ontwikkeldoelen per persoon en team
- Gespreksdocumenten/ontwikkeloverzichten
- Rapportages/export
- Mededelingen/deadlines
- Bibliotheek/protocollen/cursusmateriaal
- Managementsignalen

**Minder nadruk op:**

- Eigen persoonlijke ontwikkeling
- Eigen POP-flow
- Eigen doelen

### Praktijkmanager

**Mag zien/gebruiken:**

- Praktijkdashboard
- Alle teams
- Alle therapeuten
- Voortgang per persoon/team
- Onboardingstatussen
- Gespreksplanning/deadlines
- Documenten/gespreksverslagen monitoren
- Mededelingen beheren
- Bibliotheek beheren
- Rapportages/export
- Mijn gegevens

**Mag niet zien/gebruiken:**

- Eigen LMS/e-learnings
- Eigen leerroute
- Eigen certificaten als leerder
- Academy-contentbeheer, tenzij later expliciet toegekend

### Academy-admin / Beheerder

**Mag zien/gebruiken:**

- Academybeheer
- Cursussen/e-learnings maken en beheren
- Modules/lessen beheren
- Toetsvragen beheren
- Evaluaties beheren
- Accreditatiecockpit
- Reviewer-preview
- Bibliotheek beheren
- Gebruikers/rollen beheren
- Rapportages/export
- Certificaten/evidence beheren

**Primair niet bedoeld als:**

- Persoonlijke leeromgeving, tenzij later bewust ook LMS-toegang nodig is

### Reviewer

**Mag zien/gebruiken:**

- Reviewer-preview van LMS/accreditatie
- Cursusinhoud controleren zonder echte voortgang
- Accreditatiedossier bekijken

**Mag niet:**

- Voortgang, toetspogingen, certificaten of evaluaties aanmaken
- Gebruikers/praktijkdata beheren

---

## 4. Navigatiestructuur per rol

### Medewerker

- Dashboard
- Academy
- Onboarding
- Mijn ontwikkeling
- Bibliotheek
- Mijn gegevens

### Teamleider

- Dashboard
- Academy
- Onboarding
- Mijn ontwikkeling
- Mijn team
- Bibliotheek
- Mijn gegevens

### Praktijkhouder

- Praktijkdashboard
- Academy
- Teams
- Therapeuten
- Ontwikkeling
- Rapportages
- Bibliotheek
- Mededelingen
- Mijn gegevens

### Praktijkmanager

- Praktijkdashboard
- Teams
- Therapeuten
- Ontwikkeling
- Rapportages
- Bibliotheek
- Mededelingen
- Mijn gegevens

### Academy-admin

- Academybeheer
- Cursussen
- LMS
- Accreditatie
- Bibliotheek
- Gebruikers
- Rapportages
- Instellingen

### Reviewer

- Review-dashboard
- Cursuspreview
- Accreditatiecheck

---

## 5. Dashboardarchitectuur

### Huidige situatie

Belangrijke bestaande files:

- `src/app/(protected)/page.tsx` — huidig dashboard.
- `src/components/app-shell.tsx` — hoofdnav.
- `src/components/user-menu.tsx` — user menu/navlogica.
- `src/app/(protected)/team/page.tsx` — teamoverzicht.
- `src/app/(protected)/team/[userId]/page.tsx` — teamlid-detail.
- `src/app/(protected)/ontwikkeling/page.tsx` — persoonlijke ontwikkeling.
- `src/app/(protected)/lms/page.tsx` — LMS-overzicht/preview.
- `src/lib/data.ts` — querylaag voor gebruikers/team/voortgang.
- `src/lib/auth.ts` — `requireUser` en `requireRole`.
- `src/lib/lms/route-access.ts` en `src/lib/lms/reviewer-preview.ts` — LMS toegang/preview.

### Gewenste dashboardopbouw

Maak panelen in:

```txt
src/components/dashboard/
  personal-learning-panel.tsx
  personal-development-panel.tsx
  team-progress-panel.tsx
  practice-progress-panel.tsx
  practice-announcements-panel.tsx
  lms-admin-panel.tsx
  dashboard-stat-card.tsx
```

Maak server-side dashboardselectie in:

```txt
src/app/(protected)/page.tsx
```

Globale flow:

```tsx
const user = await requireUser();

if (user.role === "PRAKTIJKMANAGER") {
  return <PracticeManagerDashboard user={user} />;
}

if (user.role === "PRAKTIJKHOUDER") {
  return <PracticeOwnerDashboard user={user} />;
}

if (user.role === "TEAMLEIDER") {
  return <TeamLeaderDashboard user={user} />;
}

if (user.role === "BEHEERDER") {
  return <AcademyAdminDashboard user={user} />;
}

if (user.role === "REVIEWER") {
  return <ReviewerDashboard user={user} />;
}

return <EmployeeDashboard user={user} />;
```

Let op: maak dashboardcomponenten als gewone server components of private functions in dezelfde file in Sprint 1; pas later opsplitsen als de file te groot wordt.

---

## 6. Datatoegang en scope

### Centrale access-helper

Maak `src/lib/access.ts`:

```ts
import type { SessionUser } from "@/lib/types";
import { canMonitorPractice } from "@/lib/roles";

export function canViewUser(viewer: SessionUser, targetUser: { id: string; teamleaderId?: string | null }) {
  if (viewer.id === targetUser.id) return true;
  if (canMonitorPractice(viewer.role)) return true;
  if (viewer.role === "TEAMLEIDER" && targetUser.teamleaderId === viewer.id) return true;
  return false;
}

export function getUserScope(viewer: SessionUser) {
  if (canMonitorPractice(viewer.role)) return "PRACTICE" as const;
  if (viewer.role === "TEAMLEIDER") return "TEAM" as const;
  return "SELF" as const;
}
```

### Queryregels

- `SELF`: alleen `viewer.id`.
- `TEAM`: users met `teamleaderId === viewer.id` plus eventueel viewer zelf in persoonlijke panels.
- `PRACTICE`: alle actieve medewerkers/teamleiders/praktijkhouder/praktijkmanager, afhankelijk van rapportcontext.
- `BEHEERDER`: adminbeheer; in praktijkmonitoring mag beheerder praktijkbreed zien.
- `REVIEWER`: geen praktijkmonitoring.

---

## 7. Teamstructuur

### Sprint 1-keuze: bestaande structuur gebruiken

De huidige `User` heeft:

```prisma
team String?
teamleaderId String?
teamleader User? @relation("TeamleaderRelation", fields: [teamleaderId], references: [id])
teamMembers User[] @relation("TeamleaderRelation")
```

Gebruik dit eerst. Dit voorkomt onnodige schema-complexiteit.

### Later: echte `Team`-tabel

Pas toevoegen als nodig voor:

- meerdere teamleiders per team;
- teamhistorie;
- teamdoelen;
- teamdocumenten;
- locaties/vestigingen;
- teammanager los van teamleider.

Mogelijk toekomstmodel:

```prisma
model Team {
  id          String   @id @default(cuid())
  name        String
  location    String?
  leadId      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Voor nu: **niet doen in Sprint 1**. Eerst dashboard en rollen stabiel maken.

---

## 8. Praktijkbrede monitorlaag

### Gewenste data voor praktijkhouder/praktijkmanager

Maak queryhelper in `src/lib/dashboard/practice.ts`:

```ts
export async function getPracticeDashboardData(viewerId: string) {
  // Return compact summary data only.
}
```

Benodigde output:

```ts
type PracticeDashboardData = {
  totals: {
    activeTherapists: number;
    teamLeads: number;
    openLearningItems: number;
    openDevelopmentGoals: number;
    upcomingConversations: number;
  };
  teams: Array<{
    name: string;
    leadName?: string;
    memberCount: number;
    lmsCompletionPercentage: number;
    onboardingCompletionPercentage: number;
    openDevelopmentGoals: number;
    attentionCount: number;
  }>;
  attention: Array<{
    userId: string;
    userName: string;
    team?: string;
    reason: string;
    href: string;
  }>;
};
```

### Praktijkhouder vs praktijkmanager

Gebruik dezelfde praktijkdata, maar andere panelen:

- Praktijkhouder krijgt óók `PersonalLearningPanel`.
- Praktijkmanager krijgt géén `PersonalLearningPanel`.
- Praktijkhouder-copy: strategisch, “praktijkontwikkeling”.
- Praktijkmanager-copy: operationeel, “opvolging en planning”.

---

## 9. LMS-toegang

### Regel

Persoonlijke LMS-omgeving voor:

- `MEDEWERKER`
- `TEAMLEIDER`
- `PRAKTIJKHOUDER`

Geen persoonlijke LMS-omgeving voor:

- `PRAKTIJKMANAGER`
- `BEHEERDER`, tenzij admin preview/beheer
- `REVIEWER`, alleen preview

### Aan te passen files

- `src/lib/lms/route-access.ts`
- `src/lib/lms/reviewer-preview.ts`
- `src/app/(protected)/lms/page.tsx`
- `src/app/lms-actions.ts`
- eventuele LMS course/lesson routes onder `src/app/(protected)/lms/`

### Belangrijke nuance

Praktijkhouder/Sjoerd mag eigen LMS voortgang maken. Dus `canMutateLearnerProgress()` mag `PRAKTIJKHOUDER` niet blokkeren als er enrollment is.

Praktijkmanager mag geen persoonlijke LMS voortgang maken. De route `/lms` moet voor praktijkmanager redirecten naar praktijkdashboard of een nette melding geven.

---

## 10. Ontwikkelingstoegang

### Regel

Persoonlijke ontwikkelomgeving voor:

- `MEDEWERKER`
- `TEAMLEIDER`

Niet primair voor:

- `PRAKTIJKHOUDER`
- `PRAKTIJKMANAGER`
- `BEHEERDER`
- `REVIEWER`

Praktijkhouder/praktijkmanager zien ontwikkeling vooral via monitoroverzichten, niet als eigen POP-flow.

### Aan te passen files

- `src/app/(protected)/ontwikkeling/page.tsx`
- `src/app/(protected)/team/[userId]/page.tsx`
- `src/lib/data.ts`
- `src/app/actions.ts`
- eventueel nieuwe praktijkroute: `src/app/(protected)/praktijk/ontwikkeling/page.tsx`

---

## 11. Routestructuur

### Korte termijn

Gebruik bestaande routes:

```txt
/                      rolgestuurd dashboard
/lms                   persoonlijke LMS of admin/reviewer preview
/ontwikkeling          persoonlijke ontwikkeling voor medewerker/teamleider
/team                  teamleider en praktijkbrede gebruikers
/team/[userId]         detail medewerker/teamlid
/admin                 academy-admin
/bibliotheek           iedereen behalve reviewer indien gewenst
/mijn-gegevens         iedereen
```

### Middellange termijn

Nieuwe routes:

```txt
/praktijk              praktijkdashboard
/praktijk/teams        alle teams
/praktijk/therapeuten  alle therapeuten
/praktijk/ontwikkeling praktijkbrede ontwikkelmonitor
/praktijk/rapportages  exports/rapportages
/praktijk/mededelingen mededelingen/deadlines beheren
```

Advies: begin met `/` rolgestuurd en `/team` uitbreiden; maak `/praktijk` zodra praktijkdashboard te groot wordt voor `/`.

---

## 12. UI-richting

### Medewerkerdashboard

Blokken:

- Jouw volgende stap
- Open e-learnings
- Onboarding
- Ontwikkeldoelen
- Documenten en gespreksverslagen
- Praktijkbibliotheek

### Teamleiderdashboard

Bovenste laag: eigen voortgang compact.

Daaronder:

- Mijn team
- Aandacht nodig
- Voortgang per therapeut
- Open ontwikkeldoelen
- Gesprekken/documenten

### Praktijkhouderdashboard

Bovenste laag:

- Praktijkbreed overzicht
- Teams vergelijken
- Aandacht nodig
- Ontwikkelstatus praktijkbreed

Daarnaast compact:

- Mijn e-learnings
- Mijn certificaten

Niet dominant:

- Mijn doelen
- Mijn persoonlijke ontwikkeling

### Praktijkmanagerdashboard

Bovenste laag:

- Praktijkbreed overzicht
- Gespreksplanning
- Deadlines
- Aandacht nodig
- Documenten/gespreksverslagen
- Teams/therapeuten

Geen:

- Mijn LMS
- Mijn leerroute

### Academy-admin dashboard

Blokken:

- Cursussen beheren
- LMS/accreditatie
- Contentstatus
- Gebruikers en rollen
- Rapportages/evidence
- Reviewer-preview

---

## 13. Implementatiefases

## Fase 0 — Voorbereiding en nulmeting

### Task 0.1: Inspecteer actuele rollen en routes

**Objective:** Leg vast waar rollen hardcoded staan voordat wijzigingen starten.

**Files:**

- Read: `prisma/schema.prisma`
- Read: `src/lib/types.ts`
- Read: `src/lib/auth.ts`
- Read: `src/components/app-shell.tsx`
- Read: `src/components/user-menu.tsx`
- Read: `src/app/(protected)/page.tsx`
- Read: `src/app/(protected)/team/page.tsx`
- Read: `src/app/(protected)/team/[userId]/page.tsx`
- Read: `src/lib/lms/route-access.ts`
- Read: `src/lib/lms/reviewer-preview.ts`

**Step 1: Search roles**

Run:

```bash
rg "MEDEWERKER|TEAMLEIDER|BEHEERDER|REVIEWER|role" src prisma -g '*.{ts,tsx,prisma}'
```

Expected: lijst met alle rolchecks.

**Step 2: Note risky checks**

Let vooral op patronen zoals:

```ts
user.role !== "MEDEWERKER"
user.role === "BEHEERDER"
role !== "MEDEWERKER"
```

Deze moeten vaak vervangen worden door semantische helpers.

**Step 3: Commit not needed**

Alleen inspectie.

---

## Fase 1 — Rollen uitbreiden zonder UI-breuk

### Task 1.1: Prisma Role enum uitbreiden

**Objective:** Voeg `PRAKTIJKMANAGER` en `PRAKTIJKHOUDER` toe aan Prisma.

**Files:**

- Modify: `prisma/schema.prisma`

**Step 1: Update enum**

```prisma
enum Role {
  MEDEWERKER
  TEAMLEIDER
  PRAKTIJKMANAGER
  PRAKTIJKHOUDER
  BEHEERDER
  REVIEWER
}
```

**Step 2: Validate Prisma**

Run:

```bash
npx prisma validate
```

Expected: schema valid.

**Step 3: Do not push DB yet**

Omdat productie-DB enumwijzigingen gevoelig kunnen zijn. Eerst alle code aanpassen en builden.

---

### Task 1.2: TypeScript Role type uitbreiden

**Objective:** Zorg dat TS alle nieuwe rollen kent.

**Files:**

- Modify: `src/lib/types.ts`

**Step 1: Update Role union**

```ts
export type Role =
  | "MEDEWERKER"
  | "TEAMLEIDER"
  | "PRAKTIJKMANAGER"
  | "PRAKTIJKHOUDER"
  | "BEHEERDER"
  | "REVIEWER";
```

**Step 2: Run type/lint**

Run:

```bash
npm run lint
```

Expected: eventuele errors rond exhaustiveness of role arrays worden zichtbaar.

---

### Task 1.3: Centrale rolhelpers toevoegen

**Objective:** Vervang losse rolinterpretatie door semantische helpers.

**Files:**

- Create: `src/lib/roles.ts`

**Step 1: Add helpers**

Gebruik de helpercode uit hoofdstuk 2.

**Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: pass.

---

### Task 1.4: User form role-select uitbreiden

**Objective:** Admin kan nieuwe rollen kiezen bij gebruiker aanmaken/bewerken.

**Files:**

- Modify: `src/app/actions.ts`
- Modify: `src/app/(protected)/admin/page.tsx`

**Step 1: Update server-side enum validation**

Zoek in `src/app/actions.ts`:

```ts
["MEDEWERKER", "TEAMLEIDER", "BEHEERDER", "REVIEWER"] as const
```

Vervang door:

```ts
["MEDEWERKER", "TEAMLEIDER", "PRAKTIJKMANAGER", "PRAKTIJKHOUDER", "BEHEERDER", "REVIEWER"] as const
```

**Step 2: Update admin select UI**

Voeg opties toe:

```tsx
<option value="PRAKTIJKMANAGER">Praktijkmanager</option>
<option value="PRAKTIJKHOUDER">Praktijkhouder</option>
```

**Step 3: Lint**

Run:

```bash
npm run lint
```

Expected: pass.

---

## Fase 2 — Navigatie per rol

### Task 2.1: App-shell navigatie rolgestuurd maken

**Objective:** Navigatie toont niet meer simpelweg `role !== MEDEWERKER`, maar gebruikt rolhelpers.

**Files:**

- Modify: `src/components/app-shell.tsx`
- Modify: `src/components/user-menu.tsx`
- Use: `src/lib/roles.ts`

**Step 1: Replace broad checks**

Vervang:

```tsx
user.role !== "MEDEWERKER"
```

Door passende helpers:

```tsx
canMonitorOwnTeam(user.role) || canMonitorPractice(user.role)
```

Voor LMS:

```tsx
canUsePersonalLms(user.role) || canManageAcademy(user.role) || user.role === "REVIEWER"
```

Voor ontwikkeling:

```tsx
canUsePersonalDevelopment(user.role)
```

**Step 2: Verify nav per rol mentally**

- Praktijkmanager ziet geen Academy/LMS.
- Praktijkhouder ziet wel Academy/LMS.
- Teamleider ziet Academy, ontwikkeling en team.
- Beheerder ziet admin.

**Step 3: Lint**

Run:

```bash
npm run lint
```

---

### Task 2.2: Role labels menselijk maken

**Objective:** UI toont prettige rolnaam in plaats van enum waar passend.

**Files:**

- Modify: `src/lib/roles.ts`
- Modify: `src/app/(protected)/mijn-gegevens/page.tsx`
- Modify: eventueel admin user cards

**Step 1: Add label helper**

```ts
export function getRoleLabel(role: Role) {
  switch (role) {
    case "MEDEWERKER":
      return "Fysiotherapeut / medewerker";
    case "TEAMLEIDER":
      return "Teamleider";
    case "PRAKTIJKMANAGER":
      return "Praktijkmanager";
    case "PRAKTIJKHOUDER":
      return "Praktijkhouder";
    case "BEHEERDER":
      return "Academy-admin";
    case "REVIEWER":
      return "Reviewer";
  }
}
```

**Step 2: Replace raw role rendering**

Bijvoorbeeld:

```tsx
{getRoleLabel(user.role)}
```

**Step 3: Lint**

Run:

```bash
npm run lint
```

---

## Fase 3 — Dashboardselectie

### Task 3.1: Dashboarddata voorbereiden

**Objective:** Huidige dashboarddata geschikt maken voor meerdere rollen.

**Files:**

- Modify: `src/app/(protected)/page.tsx`
- Modify/Create: `src/lib/dashboard/personal.ts`
- Modify/Create: `src/lib/dashboard/team.ts`
- Modify/Create: `src/lib/dashboard/practice.ts`

**Step 1: Extract personal data loading**

Maak helper voor persoonlijke voortgang.

**Step 2: Extract team data loading**

Maak helper voor teamleideroverzicht.

**Step 3: Extract practice data loading**

Maak helper voor praktijkbrede samenvatting.

**Step 4: Lint/build**

Run:

```bash
npm run lint
npm run build
```

---

### Task 3.2: Medewerkerdashboard component maken

**Objective:** Medewerker krijgt compacte persoonlijke start.

**Files:**

- Modify: `src/app/(protected)/page.tsx`
- Create: `src/components/dashboard/personal-learning-panel.tsx`
- Create: `src/components/dashboard/personal-development-panel.tsx`

**Panels:**

- Jouw volgende stap
- Open e-learnings
- Onboarding
- Ontwikkeldoelen
- Documenten
- Praktijkbibliotheek CTA

**Verification:**

- Login als medewerker of seed-user.
- `/` toont geen team/praktijk/admin blokken.

---

### Task 3.3: Teamleiderdashboard component maken

**Objective:** Teamleider ziet eigen leeromgeving plus teamomgeving.

**Files:**

- Modify: `src/app/(protected)/page.tsx`
- Create: `src/components/dashboard/team-progress-panel.tsx`

**Panels:**

- Eigen e-learnings compact
- Eigen ontwikkeling compact
- Mijn team
- Aandacht nodig
- Voortgang per therapeut
- Gesprekken/documenten

**Server-side rule:**

- Teamdata alleen waar `teamleaderId === viewer.id`.

**Verification:**

- Teamleider ziet eigen teamleden.
- Teamleider ziet geen andere teams.
- Directe URL naar ander teamlid redirectt of blokkeert.

---

### Task 3.4: Praktijkhouderdashboard component maken

**Objective:** Praktijkhouder ziet praktijkbreed dashboard plus eigen LMS compact.

**Files:**

- Modify: `src/app/(protected)/page.tsx`
- Create: `src/components/dashboard/practice-progress-panel.tsx`

**Panels:**

- Praktijkbreed overzicht
- Teams vergelijken
- Aandacht nodig
- Ontwikkelstatus
- Rapportages CTA
- Mijn e-learnings compact
- Mijn certificaten compact

**Belangrijk:**

Geen grote POP/eigen ontwikkeling-flow op de homepage.

**Verification:**

- Praktijkhouder ziet alle teams.
- Praktijkhouder ziet `Academy`/LMS-link.
- Praktijkhouder kan eigen LMS openen en voortgang maken indien enrollment bestaat.

---

### Task 3.5: Praktijkmanagerdashboard component maken

**Objective:** Praktijkmanager ziet praktijkbreed monitor-dashboard zonder eigen LMS.

**Files:**

- Modify: `src/app/(protected)/page.tsx`
- Reuse: `src/components/dashboard/practice-progress-panel.tsx`

**Panels:**

- Praktijkbreed overzicht
- Gespreksplanning
- Deadlines
- Aandacht nodig
- Documenten/gespreksverslagen
- Teams/therapeuten

**Geen panels:**

- Open e-learnings van zichzelf
- Mijn certificaten
- Mijn leerroute

**Verification:**

- Praktijkmanager ziet geen `Academy`/LMS-link in nav.
- `/lms` redirectt naar `/` of toont nette geen-toegang melding.

---

### Task 3.6: Academy-admin dashboard aanscherpen

**Objective:** Beheerderdashboard focust op beheer, niet persoonlijke leerroute.

**Files:**

- Modify: `src/app/(protected)/page.tsx`
- Create: `src/components/dashboard/lms-admin-panel.tsx`

**Panels:**

- Cursussen beheren
- Accreditatie
- Reviewer preview
- Gebruikers en rollen
- Bibliotheekbeheer
- Rapportages/evidence

**Verification:**

- Beheerder ziet adminlinks.
- Beheerder preview vervuilt geen learner progress.

---

## Fase 4 — Route access hard maken

### Task 4.1: Teamroutes uitbreiden naar praktijkhouder/praktijkmanager

**Objective:** `/team` en `/team/[userId]` ondersteunen teamleider én praktijkbrede rollen.

**Files:**

- Modify: `src/app/(protected)/team/page.tsx`
- Modify: `src/app/(protected)/team/[userId]/page.tsx`
- Use/Create: `src/lib/access.ts`

**Access:**

```ts
await requireRole(["TEAMLEIDER", "PRAKTIJKMANAGER", "PRAKTIJKHOUDER", "BEHEERDER"]);
```

**Scope:**

- Teamleider: eigen teamleden.
- Praktijkmanager/praktijkhouder/beheerder: alle relevante medewerkers.

**Verification:**

- Teamleider kan ander teamlid niet openen.
- Praktijkhouder kan iedere therapeut openen.
- Praktijkmanager kan iedere therapeut openen.

---

### Task 4.2: LMS route access aanpassen

**Objective:** Praktijkhouder krijgt persoonlijke LMS; praktijkmanager niet.

**Files:**

- Modify: `src/lib/lms/route-access.ts`
- Modify: `src/lib/lms/reviewer-preview.ts`
- Modify: `src/app/(protected)/lms/page.tsx`
- Modify: `src/app/lms-actions.ts`

**Rules:**

- `PRAKTIJKHOUDER` behaves as learner when enrolled.
- `PRAKTIJKMANAGER` has no learner LMS.
- `BEHEERDER` and `REVIEWER` remain preview-safe.

**Verification:**

- Add/adjust helper tests if project has test setup.
- Manual build.
- Role review in code.

---

### Task 4.3: Ontwikkeling route access aanpassen

**Objective:** Eigen ontwikkeling blijft voor medewerker/teamleider; praktijkrollen monitoren via praktijk/teamdetail.

**Files:**

- Modify: `src/app/(protected)/ontwikkeling/page.tsx`
- Modify: `src/components/app-shell.tsx`

**Rule:**

- `MEDEWERKER` en `TEAMLEIDER`: toegang.
- `PRAKTIJKHOUDER` en `PRAKTIJKMANAGER`: redirect naar praktijk/teamoverzicht of duidelijke melding.
- `BEHEERDER`: alleen indien beheercontext nodig, anders admin/praktijkmonitor.

**Verification:**

- Praktijkhouder ziet ontwikkeling niet dominant in nav.
- Directe route geeft geen crash.

---

## Fase 5 — Praktijkbrede managementlaag

### Task 5.1: Praktijkdashboard datahelper bouwen

**Objective:** Eén server-side helper levert compacte praktijkmonitoringdata.

**Files:**

- Create: `src/lib/dashboard/practice.ts`
- Modify: `src/lib/data.ts` waar nodig

**Data:**

- Actieve therapeuten
- Teams/teamleiders
- LMS voortgang
- Onboarding voortgang
- Open ontwikkeldoelen
- Documenten/gespreksverslagen
- Aandacht nodig

**Verification:**

- Query is server-side scoped.
- Geen gevoelige overfetch richting client components.

---

### Task 5.2: Teamvergelijking UI bouwen

**Objective:** Praktijkhouder/praktijkmanager krijgen overzicht per team.

**Files:**

- Create/Modify: `src/components/dashboard/practice-progress-panel.tsx`

**UI:**

- Compacte teamcards.
- Percentage LMS/onboarding.
- Open doelen.
- Aandacht nodig.
- CTA naar team/therapeutenoverzicht.

**Designregels:**

- Compacte cards.
- Geen overmatige whitespace.
- Duidelijke CTA’s.
- Teal/sage primair, orange accent voor aandacht.

---

### Task 5.3: Aandacht-nodig signalen toevoegen

**Objective:** Praktijkbreed en teamleiderdashboard tonen waar opvolging nodig is.

**Signals eerste versie:**

- Onboarding open bij nieuwe medewerker.
- E-learning gestart maar niet afgerond.
- Ontwikkeldoel open/lang open.
- Geen recente gespreksdocumenten.

**Files:**

- Modify: `src/lib/dashboard/team.ts`
- Modify: `src/lib/dashboard/practice.ts`
- Modify: dashboard panels

**Verification:**

- Signalering is informatief, niet beschuldigend.
- Copy blijft positief: “Aandacht nodig” in plaats van “achterstallig”.

---

## Fase 6 — Mededelingen/deadlines

### Task 6.1: Beslis tijdelijk of persistent

**Objective:** Kies of mededelingen eerst statisch/seeded zijn of direct DB-model krijgen.

**Advies:**

- Als Sjoerd mededelingen wil kunnen beheren: direct DB-model.
- Als het alleen demo/stakeholder is: eerst statisch/seeded.

### Task 6.2: Announcement model toevoegen

**Objective:** Praktijkbrede mededelingen/deadlines persistent maken.

**Files:**

- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`
- Create: `src/lib/dashboard/announcements.ts`
- Add admin/praktijkmanager actions in `src/app/actions.ts`

**Possible model:**

```prisma
model Announcement {
  id          String   @id @default(cuid())
  title       String
  body        String
  audience    String   @default("PRACTICE")
  startsAt    DateTime?
  endsAt      DateTime?
  deadlineAt  DateTime?
  isPublished Boolean  @default(false)
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Let op:** Dit vereist extra relation op `User`.

---

## Fase 7 — Tests en validatie

### Task 7.1: Role helper tests

**Objective:** Rolregels vastleggen zodat latere wijzigingen niets stukmaken.

**Files:**

- Create: test voor `src/lib/roles.ts` indien testframework aanwezig.

**Testcases:**

- Praktijkhouder `canUsePersonalLms === true`.
- Praktijkmanager `canUsePersonalLms === false`.
- Teamleider `canUsePersonalDevelopment === true`.
- Praktijkhouder `canUsePersonalDevelopment === false`.
- Praktijkmanager/praktijkhouder `canMonitorPractice === true`.
- Teamleider `canMonitorPractice === false`.

### Task 7.2: Access helper tests

**Objective:** Teamleider kan alleen eigen team zien, praktijkrollen iedereen.

**Testcases:**

- Medewerker ziet zichzelf.
- Medewerker ziet collega niet.
- Teamleider ziet teamlid.
- Teamleider ziet andere medewerker niet.
- Praktijkhouder ziet alle medewerkers.
- Praktijkmanager ziet alle medewerkers.
- Reviewer ziet praktijkdata niet.

### Task 7.3: Validatiecommands

Run:

```bash
npx prisma validate
npm run lint
npm run build
```

Als Prisma schema wijzigt:

```bash
npx prisma generate
```

Alleen na expliciete akkoord voor DB:

```bash
npx prisma migrate dev --name add-practice-roles
# of productiegeschikte migratieflow via Vercel/Neon
```

---

## Fase 8 — Deploydiscipline

### Task 8.1: Pre-commit check

Run:

```bash
git status --short
git diff --ignore-space-at-eol --check
npm run lint
npm run build
```

Expected: alles pass.

### Task 8.2: Commit

```bash
git add prisma/schema.prisma src docs/plans

git commit -m "feat: add role-driven dashboards plan and foundations"
```

Gebruik bij alleen plan:

```bash
git add docs/plans/2026-05-07-rolgestuurde-dashboards-teamstructuur-bouwplan.md

git commit -m "docs: add role-driven dashboard build plan"
```

### Task 8.3: Push en Vercel-check

```bash
git push origin main
```

Controleer:

- `git rev-parse HEAD`
- `git ls-remote origin refs/heads/main`
- GitHub/Vercel deployment status
- Public smoke-check `https://fy-fit-academy.vercel.app/login`

---

## 14. Acceptatiecriteria

### Functioneel

- Medewerker ziet alleen eigen leer-/ontwikkelomgeving.
- Teamleider ziet eigen leer-/ontwikkelomgeving plus eigen team.
- Teamleider kan geen andere teams/therapeuten openen.
- Praktijkhouder ziet alle teams/therapeuten en praktijkbrede monitoring.
- Praktijkhouder heeft ook eigen LMS/e-learnings.
- Praktijkhouderdashboard legt minder nadruk op eigen ontwikkeling/POP.
- Praktijkmanager ziet alle teams/therapeuten en praktijkbrede monitoring.
- Praktijkmanager heeft geen eigen LMS/e-learningomgeving.
- Beheerder houdt toegang tot Academy/LMS beheer.
- Reviewer-preview blijft non-mutating.

### Technisch

- Nieuwe rollen bestaan in Prisma en TypeScript.
- Rolchecks gebruiken centrale helpers waar mogelijk.
- Server-side access blokkeert ongewenste data.
- Build en lint slagen.
- Geen productie-DB migratie zonder expliciete akkoord.

### UX

- Navigatie voelt per rol logisch en rustig.
- Geen dashboard wordt een alles-op-één-hoop scherm.
- Praktijkhouder = monitoren + eigen LMS.
- Praktijkmanager = monitoren zonder eigen LMS.
- Teamleider = eigen omgeving + teamomgeving.
- Copy blijft positief en niet-controlerend.

---

## 15. Risico’s en aandachtspunten

### Prisma enum migratie

Nieuwe enumwaarden in PostgreSQL vereisen een nette migratie. Niet blind `db push` op productie draaien.

### Single role vs multi-role

Nu heeft `User.role` één waarde. Dat is prima voor deze fase.

Mogelijke latere behoefte:

- Sjoerd is `PRAKTIJKHOUDER` én `BEHEERDER`.
- Een teamleider is ook Academy-admin.

Als dit vaak voorkomt, later migreren naar multi-role:

```prisma
model UserRole {
  userId String
  role   Role
  @@id([userId, role])
}
```

Voor nu: **YAGNI**. Eerst één primaire rol stabiel maken.

### Beheerder vs praktijkhouder

Niet automatisch alles wat beheerder kan ook aan praktijkhouder geven. Praktijkhouder monitort; beheerder beheert Academy-content.

### Praktijkmanager zonder LMS

Let op bestaande checks zoals `role !== "MEDEWERKER"`; die zouden praktijkmanager nu per ongeluk toegang tot LMS/Team/Admin-achtige dingen kunnen geven. Deze moeten vervangen worden door expliciete helpers.

### Reviewer non-mutating

Niet breken. Reviewer mag blijven previewen zonder voortgang/toets/certificaat te muteren.

---

## 16. Aanbevolen bouwvolgorde kort

1. Rollen uitbreiden in Prisma/TS.
2. Centrale rolhelpers maken.
3. Navigatie per rol corrigeren.
4. Dashboardselectie per rol maken.
5. Teamleiderdashboard bouwen.
6. Praktijkhouderdashboard bouwen.
7. Praktijkmanagerdashboard bouwen.
8. LMS access aanpassen: praktijkhouder wel, praktijkmanager niet.
9. Team/praktijk access hard maken.
10. Tests/lint/build.
11. Pas daarna migratie/deploy.

---

## 17. Open beslispunten voor Sjoerd

Deze hoeven Sprint 1 niet te blokkeren, maar moeten vóór praktijkbrede rapportages scherp worden:

1. Mag praktijkmanager gespreksdocumenten ook toevoegen, of alleen bekijken/plannen?
2. Mag praktijkhouder ook gebruikersrollen wijzigen, of blijft dat alleen Academy-admin?
3. Moet Sjoerd als praktijkhouder óók Academy-admin zijn, of houden we dat als aparte beheeraccount?
4. Willen we echte teams met een `Team`-tabel, of is `team` + `teamleaderId` voorlopig genoeg?
5. Moeten praktijkmanager/praktijkhouder gevoelige persoonlijke notities zien, of alleen team-/gespreksdocumenten met zichtbaarheid `TEAM`?

---

## 18. Eerste uitvoerbare sprintvoorstel

### Sprint 1 scope

Doel: rollen en dashboards zichtbaar goed scheiden zonder zware nieuwe datamodellen.

Meenemen:

- `PRAKTIJKMANAGER` en `PRAKTIJKHOUDER` toevoegen.
- Rolhelpers toevoegen.
- Navigatie aanpassen.
- `/` rolgestuurd maken.
- Praktijkhouder ziet eigen LMS-panel + praktijkmonitor.
- Praktijkmanager ziet praktijkmonitor zonder LMS.
- Teamleider ziet eigen omgeving + teamblok.
- Teamroutes access uitbreiden.
- LMS route access aanpassen.

Niet meenemen:

- Echte `Team`-tabel.
- Volledige rapportage-export.
- Mededelingenbeheer met database, tenzij apart gekozen.
- Multi-role users.

### Sprint 1 validatie

```bash
npx prisma validate
npm run lint
npm run build
```

Daarna pas migratie/deploy bespreken.
