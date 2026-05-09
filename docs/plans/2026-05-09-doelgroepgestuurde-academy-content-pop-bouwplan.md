# Doelgroepgestuurde Academy, contentzichtbaarheid en persoonlijk POP bouwplan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Bouw de Fy-Fit Academy door naar een praktijkbrede leer- en ontwikkelomgeving waarin fysiotherapeuten, praktijkondersteuners en fitcoaches een eigen passende omgeving krijgen, zonder planning/declaraties/EPD-operatie in de Academy te trekken.

**Architecture:** Scheid autorisatie (`Role`) van doelgroep/functieprofiel (`AudienceProfile`). Rechten bepalen wat iemand mag beheren/monitoren; doelgroep en expliciete contenttargets bepalen welke e-learnings en informatie iemand ziet. POP blijft persoonlijk en vrij: geen vaste categorieën afdwingen.

**Tech Stack:** Next.js App Router, React, Prisma/PostgreSQL, TypeScript, server actions, Node test runner met `tsx`.

---

## Domeinbesluiten

1. De Academy is de leer-, informatie-, onboarding- en ontwikkellaag bovenop het werk.
2. De Academy bevat geen planning, agenda, declaraties of EPD-operationele workflows.
3. Front-office en back-office worden samen behandeld als `PRAKTIJKONDERSTEUNER`.
4. Initiele doelgroepen:
   - `FYSIOTHERAPEUT`
   - `PRAKTIJKONDERSTEUNER`
   - `FITCOACH`
5. POP is persoonlijk en flexibel:
   - eigen ontwikkeldoelen
   - actiepunten/omschrijving
   - reflectie/notities
   - status
   - doeldatum/evaluatiemoment
   - eventueel gekoppelde e-learning/document later
   Geen vaste POP-categorieën.
6. Admins moeten bij content kunnen aangeven wie de content mag zien, op basis van:
   - iedereen
   - rol(len)
   - doelgroep(en)
   - specifieke account(s)
   - later eventueel team/locatie

---

## Sprint 2A — Fundament doelgroepmodel en contentzichtbaarheid

**Objective:** Leg het datamodel en de server-side regels neer waarmee gebruikers een doelgroep hebben en cursussen zichtbaar worden op basis van rol/doelgroep/account.

### Task 1: Voeg doelgroep enum en user-veld toe

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/types.ts`
- Test: `tests/lib/audience.test.ts`

**Steps:**
1. Voeg Prisma enum toe:
   - `FYSIOTHERAPEUT`
   - `PRAKTIJKONDERSTEUNER`
   - `FITCOACH`
2. Voeg `audienceProfile AudienceProfile @default(FYSIOTHERAPEUT)` toe op `User`.
3. Voeg TypeScript type `AudienceProfile` toe.
4. Voeg helperlabels toe in een nieuwe of bestaande lib-file.
5. Test dat labels en defaultkeuzes correct zijn.

### Task 2: Voeg contentzichtbaarheid toe aan Course

**Files:**
- Modify: `prisma/schema.prisma`
- Modify/Create: `src/lib/content-visibility.ts`
- Test: `tests/lib/content-visibility.test.ts`

**Steps:**
1. Voeg velden toe aan `Course`:
   - `visibleToAll Boolean @default(true)`
   - `visibleToRoles Role[] @default([])`
   - `visibleToAudienceProfiles AudienceProfile[] @default([])`
   - `visibleToUserIds String[] @default([])`
2. Bouw helper `isContentVisibleForUser(content, user)`.
3. Regels:
   - Beheerder/reviewer mogen beheer/preview zien via bestaande reviewregels.
   - `visibleToAll=true` maakt gepubliceerde content zichtbaar voor alle persoonlijke LMS-gebruikers.
   - rolmatch geeft toegang.
   - doelgroepmatch geeft toegang.
   - userId-match geeft toegang.
   - geen match betekent niet zichtbaar.
4. Test combinaties voor fysio, PO, fitcoach, specifieke gebruiker en rol.

### Task 3: Filter Academy/LMS queries server-side

**Files:**
- Modify: `src/lib/lms/queries.ts`
- Modify: `src/app/lms-actions.ts`
- Relevant routes: `src/app/(protected)/academy/**`, `src/app/(protected)/lms/**`
- Test: focused helper tests first; route behavior via build/lint.

**Steps:**
1. Pas learner query aan zodat persoonlijke Academy alleen zichtbare, gepubliceerde content toont.
2. Pas start/progress actions aan zodat directe URL/form-bypass onmogelijk is.
3. Reviewer/beheer-preview blijft datavrij en breed zichtbaar.
4. Geen UI-only beveiliging: server-side checks blijven leidend.

### Task 4: Admin UI voor contentdoelgroep

**Files:**
- Modify: `src/components/lms/accreditation-panel.tsx`
- Modify: `src/app/lms-actions.ts`
- Modify: `src/lib/lms/types.ts`

**Steps:**
1. Vervang vrij tekstveld “Doelgroep” niet direct; behoud het als beschrijvende accreditatie-metadata indien nuttig.
2. Voeg apart blok “Zichtbaarheid” toe:
   - iedereen
   - rollen checkboxen
   - doelgroepen checkboxen
   - specifieke gebruikers via comma-separated ids/e-mail fallback later
3. Sla zichtbaarheid op via `saveCourseAccreditationMetadataAction`.
4. Toon samenvatting bij cursusdetail/admin.

### Task 5: Admin gebruikersbeheer doelgroepveld

**Files:**
- Modify: `src/app/(protected)/admin/page.tsx`
- Modify: `src/app/actions.ts`
- Modify: `src/lib/data.ts`

**Steps:**
1. Toon doelgroep in gebruikersoverzicht.
2. Laat beheerder doelgroep wijzigen.
3. Houd accountaanmaak/checklist consistent: naam, email, rol, doelgroep, team, functie/titel, locatie, teamleider, onboarding, evt. BIG/KRF/SKF.

---

## Sprint 2B — Persoonlijk POP-dashboard zonder vaste categorieën

**Objective:** Maak de ontwikkelomgeving geschikt voor alle medewerkers, zonder doelgroepvaste POP-categorieën.

### Task 1: Taal neutraliseren

**Files:**
- Modify: `src/app/(protected)/ontwikkeling/page.tsx`
- Modify: `src/app/(protected)/page.tsx`
- Modify: `src/app/(protected)/team/[userId]/page.tsx`

**Steps:**
1. Gebruik neutrale taal: medewerker, ontwikkeldoel, voortgang, reflectie.
2. Vermijd fysio-only termen waar het over persoonlijk POP gaat.
3. Laat doelgroep alleen de context/voorbeeldtekst kleuren, niet de structuur afdwingen.

### Task 2: POP persoonlijk houden

**Files:**
- Existing: `LearningGoal`, `DevelopmentDocument`
- Modify only if needed.

**Steps:**
1. Geen vaste POP-categorieën toevoegen.
2. Bestaande vrije velden blijven leidend.
3. Later eventueel suggestietemplates toevoegen, maar niet afdwingen.

---

## Sprint 2C — Team/praktijkmonitor doelgroepfiltering

**Objective:** Teamleiders/praktijkhouder/praktijkmanager kunnen ontwikkeling en leerstatus filteren op doelgroep zonder privacygrenzen te overschrijden.

**Files:**
- Modify: `src/app/(protected)/team/page.tsx`
- Modify: `src/lib/data.ts`

**Steps:**
1. Voeg doelgroep zichtbaar toe bij teamleden.
2. Voeg simpele filterchips of sections toe: iedereen, fysiotherapeut, praktijkondersteuner, fitcoach.
3. Houd server-side team/praktijk scope zoals in Sprint 1.

---

## Validatie

Run na elke implementatiesprint:

```bash
node --import tsx --test tests/lib/roles.test.ts tests/lib/lms/route-access.test.ts tests/lib/lms/reviewer-preview.test.ts tests/lib/audience.test.ts tests/lib/content-visibility.test.ts
npx prisma validate
npm run lint
npm run build
```

Na codewijzigingen:

```bash
git status --short --branch
git diff --stat
git add ...
git commit -m "feat: add audience-driven content visibility"
git push
```

Productie-DB schema pas pushen na expliciet akkoord als Prisma schema is gewijzigd.
