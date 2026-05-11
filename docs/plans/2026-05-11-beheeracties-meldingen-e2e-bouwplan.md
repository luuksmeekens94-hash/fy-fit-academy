# Beheeracties, meldingen en rol-E2E Bouwplan

> **Voor Hermes:** Gebruik `subagent-driven-development` of voer strikt TDD uit per sprint. Eerst failing tests, daarna implementatie, daarna lint/build, commit/push/smoke.

**Goal:** Vandaag de huidige cockpitlaag doorbouwen naar echte opslag/server actions, een bruikbare mededelingen- en meldingenstroom, diepere Academybeheer-CRUD en ingelogde rol-E2E-tests.

**Architecture:** Bouw dit in vier sprints. Start met een centrale meldingen/nieuws-domeinlaag, zodat alle latere acties automatisch signalen kunnen maken. Houd role/auth checks server-side in acties en routes. UI blijft Next.js App Router met server actions; pure helpers blijven onder `src/lib/...` en worden met `node --import tsx --test` getest.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma 7/PostgreSQL, Tailwind CSS 4, Node test runner, later Playwright voor browser-E2E.

---

## Scope voor vandaag

### In scope

1. Echte opslag/server actions achter de nieuwe formulieren op `/praktijkbeheer`.
2. Mededelingen-publicatieflow met concept/publiceren/archiveren en role/audience targeting.
3. Meldingen/nieuws/info-stukje:
   - nieuwe e-learning gepubliceerd of gewijzigd;
   - deadline nadert voor POP/functioneren/e-learning;
   - belangrijke praktijkmededeling;
   - zichtbaar icoontje/badge in shell en dashboard/cockpit.
4. Diepere CRUD-schermen voor Academybeheer:
   - vraagbank/toetsvragen;
   - evaluatievragen/templates;
   - accreditatievelden/checklist;
   - cursusversie/publicatieflow.
5. Ingelogde E2E-test per rol met veilige testaccounts/test-seed.

### Buiten scope vandaag

- E-mail/push-notificaties buiten de app.
- Kalenderintegratie met Google/Microsoft.
- Volledig drag-and-drop course authoring.
- Productie-database mutaties zonder expliciete aparte goedkeuring.
- Secrets/tokens/passwords in code, plan of chat.

---

## Datamodelvoorstel

Voeg Prisma enums/modellen toe met veilige defaults.

### Nieuwe enums

```prisma
enum AnnouncementStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum AnnouncementPriority {
  INFO
  IMPORTANT
  URGENT
}

enum NotificationType {
  ANNOUNCEMENT
  COURSE_PUBLISHED
  COURSE_UPDATED
  DEADLINE_APPROACHING
  DEADLINE_OVERDUE
  ACCREDITATION_REVIEW
  SYSTEM
}

enum NotificationSeverity {
  INFO
  SUCCESS
  WARNING
  CRITICAL
}
```

### Nieuwe modellen

```prisma
model Announcement {
  id                        String               @id @default(cuid())
  title                     String
  body                      String
  status                    AnnouncementStatus   @default(DRAFT)
  priority                  AnnouncementPriority @default(INFO)
  targetRoles               Role[]               @default([])
  targetAudienceProfiles    AudienceProfile[]    @default([])
  targetUserIds             String[]             @default([])
  visibleToAll              Boolean              @default(true)
  publishAt                 DateTime?
  expiresAt                 DateTime?
  createdAt                 DateTime             @default(now())
  updatedAt                 DateTime             @updatedAt
  createdById               String
  publishedById             String?
  createdBy                 User                 @relation("AnnouncementCreatedBy", fields: [createdById], references: [id])
  publishedBy               User?                @relation("AnnouncementPublishedBy", fields: [publishedById], references: [id])
}

model Notification {
  id             String               @id @default(cuid())
  userId         String
  type           NotificationType
  severity       NotificationSeverity @default(INFO)
  title          String
  body           String
  href           String?
  sourceId       String?
  sourceType     String?
  readAt         DateTime?
  createdAt      DateTime             @default(now())
  expiresAt      DateTime?
  user           User                 @relation(fields: [userId], references: [id])

  @@index([userId, readAt, createdAt])
  @@index([type, createdAt])
}
```

### User-relaties toevoegen

```prisma
announcementsCreated   Announcement[] @relation("AnnouncementCreatedBy")
announcementsPublished Announcement[] @relation("AnnouncementPublishedBy")
notifications          Notification[]
```

---

## Sprint 0 — Voorbereiding en schema safety

**Doel:** zorgen dat schemawijzigingen en teststrategie scherp staan vóór bouwen.

### Taken

1. Controleer git-status en werkboom.
   - Command: `git status --short --branch`
   - Verwacht: schoon of alleen planbestand.
2. Voeg schema test toe.
   - Bestand: `tests/prisma/communication-schema.test.ts`
   - Test controleert dat schema de enums/modellen bevat via tekstuele schema-inspectie.
3. Run RED.
   - Command: `node --import tsx --test tests/prisma/communication-schema.test.ts`
   - Verwacht: fail omdat modellen/enums ontbreken.
4. Voeg Prisma enums/modellen toe.
   - Bestand: `prisma/schema.prisma`
5. Run GREEN.
   - Command: `npx prisma format && npm run db:generate && node --import tsx --test tests/prisma/communication-schema.test.ts`
6. Commit.
   - Commit: `feat: add communication notification schema`

### Acceptatiecriteria

- Prisma format/generate groen.
- Geen bestaande data gemuteerd.
- Nieuwe modellen zijn append-only en hebben veilige defaults.

---

## Sprint 1 — Meldingen/nieuws/info basislaag

**Doel:** centrale notificatie-helper en app-shell indicator bouwen, zodat elke actie later signalen kan aanmaken.

### Bestanden

- Create: `src/lib/notifications.ts`
- Create: `tests/lib/notifications.test.ts`
- Modify: `src/components/app-shell.tsx`
- Modify: `src/app/(protected)/layout.tsx`
- Create: `src/components/notification-bell.tsx`

### TDD taken

1. Test rol-/doelgroepfiltering:
   - medewerker ziet algemene, eigen rol en eigen doelgroep meldingen;
   - praktijkmanager ziet praktijkbrede beheeralerts;
   - reviewer ziet alleen reviewer/accreditatiealerts.
2. Test deadline urgentie:
   - binnen 14 dagen = `WARNING`;
   - verlopen = `CRITICAL`;
   - afgerond = geen deadline-alert.
3. Test unread-count builder.
4. Implement helpers:
   - `buildNotificationCenter({ user, notifications })`
   - `buildDeadlineNotifications({ goals, enrollments, now })`
   - `canSeeAnnouncement(user, announcement)`
5. App-shell krijgt compacte bel/badge rechtsboven in profielblok.
6. Dashboard/home krijgt bovenaan een klein “Nieuws & signalen” blok met max 3 meest relevante items.

### Acceptatiecriteria

- Badge toont alleen ongelezen relevante meldingen.
- Geen client-side-only security: zichtbaarheid wordt server-side gefilterd.
- Geen meldingenspam: helpers dedupliceren op `sourceType/sourceId/type` in de action-laag.

### Commit

`feat: add notification center foundation`

---

## Sprint 2 — Praktijkbeheer: echte opslag en mededelingen-publicatieflow

**Doel:** `/praktijkbeheer` formulieren omzetten van concept-UI naar server actions met opslag.

### Bestanden

- Create: `src/app/practice-management-actions.ts`
- Create: `tests/lib/practice-management-actions.test.ts`
- Modify: `src/app/(protected)/praktijkbeheer/page.tsx`
- Modify: `src/lib/practice-management.ts`

### Server actions

1. `createAnnouncementDraftAction(formData)`
   - Rollen: `PRAKTIJKMANAGER`, `PRAKTIJKHOUDER`, `BEHEERDER`.
   - Valideert titel/body/eigenaar/doelgroep.
   - Maakt `Announcement` met `DRAFT`.
2. `publishAnnouncementAction(formData)`
   - Rollen: zelfde.
   - Zet status naar `PUBLISHED`, `publishedById`, `publishAt`.
   - Maakt `Notification` voor relevante gebruikers.
3. `archiveAnnouncementAction(formData)`
   - Rollen: zelfde.
   - Zet status naar `ARCHIVED`.
4. `createPracticeDeadlineAction(formData)`
   - Maakt of update `LearningGoal.targetDate` of later apart deadline-model als nodig.
   - Vandaag: pragmatisch koppelen aan bestaande `LearningGoal`.
5. `createConversationPrepAction(formData)`
   - Als er nog geen passend model is: maak `DevelopmentDocument` met categorie `GESPREK`/`POP` en visibility `TEAM`.

### TDD taken

1. RED: praktijkmanager mag announcement draft maken.
2. RED: medewerker mag geen announcement action uitvoeren.
3. RED: publiceren maakt notificaties voor juiste doelgroep.
4. RED: archiveren verbergt mededeling uit publicatiefeed.
5. GREEN: acties implementeren met helperfuncties die mockbaar/testbaar zijn.
6. UI: formulieren krijgen `action={...}` en knoppen “Concept opslaan”, “Publiceren”, “Archiveren”.

### Acceptatiecriteria

- Mededelingen worden opgeslagen.
- Publicatie maakt in-app meldingen.
- Praktijkmanager heeft geen persoonlijke LMS-flow nodig.
- Formulieren liegen niet meer: concept/publicatie werkt echt.

### Commit

`feat: persist practice announcements and notifications`

---

## Sprint 3 — Deadline-signalen voor POP, functioneren en e-learning

**Doel:** meldingen automatisch zichtbaar maken wanneer deadlines naderen of verlopen.

### Bestanden

- Modify: `src/lib/notifications.ts`
- Create: `tests/lib/deadline-notifications.test.ts`
- Modify: `src/app/(protected)/page.tsx`
- Modify: `src/app/(protected)/praktijkbeheer/page.tsx`
- Optioneel create: `src/components/notification-feed.tsx`

### Signaalbronnen

1. `LearningGoal.targetDate` voor POP/ontwikkeling.
2. `Enrollment.deadlineAt` voor verplichte e-learning.
3. `Course.revisionDueAt` voor Academybeheer/accreditatie-herziening.

### TDD taken

1. RED: POP-deadline binnen 14 dagen geeft medewerker + teamleider/praktijkmanager waarschuwing.
2. RED: verlopen POP-deadline geeft `CRITICAL`.
3. RED: e-learning deadline binnen 14 dagen geeft medewerker waarschuwing.
4. RED: revisiedatum cursus geeft beheerder/accreditatie-alert.
5. GREEN: helper bouwen.
6. UI: feed toont labels `Binnenkort`, `Over tijd`, `Nieuwe e-learning`, `Review nodig`.

### Acceptatiecriteria

- Dashboard en cockpit tonen relevante signalen per rol.
- Praktijkhouder ziet praktijkbrede signalen, niet alleen eigen leerwerk.
- Reviewer krijgt geen muterende/operationele notificaties.

### Commit

`feat: surface deadline and course notifications`

---

## Sprint 4 — Academybeheer CRUD dieper maken

**Doel:** van checklistvelden naar echte beheeracties voor vraagbank, evaluatie en accreditatie.

### Bestanden

- Modify: `src/app/lms-actions.ts`
- Modify: `src/app/(protected)/academybeheer/page.tsx`
- Modify: `src/components/lms/accreditation-panel.tsx`
- Create: `tests/lib/lms/academy-admin-actions.test.ts`
- Optioneel create:
  - `src/components/lms/question-bank-editor.tsx`
  - `src/components/lms/evaluation-template-editor.tsx`
  - `src/components/lms/course-version-editor.tsx`

### Server actions

Bestaande actions zijn er al deels:
- `saveCourseAccreditationMetadataAction`
- `saveCourseAccreditationStructureAction`
- `saveAssessmentAccreditationRulesAction`
- `applyStandardEvaluationTemplateAction`
- `publishCourseAccreditationReadyAction`

Vandaag verdiepen met:
1. `createAssessmentQuestionAction(formData)`
   - maakt `Question` + `QuestionOption[]` + doelkoppelingen.
2. `updateAssessmentQuestionAction(formData)`
   - bewerkt prompt/type/explanation/options/objectives.
3. `deleteAssessmentQuestionAction(formData)`
   - alleen als geen historische attempts afhankelijk zijn; anders archief/soft-disable overwegen.
4. `upsertEvaluationQuestionAction(formData)`
   - maakt/wijzigt evaluatievraag in bestaande form.
5. `createCourseVersionAction(formData)`
   - maakt nieuwe `CourseVersion`, change log, status terug naar `REVIEW` of `CONCEPT`.

### TDD taken

1. RED: beheerder kan toetsvraag met opties en leerdoelkoppeling maken.
2. RED: reviewer kan geen toetsvraag maken.
3. RED: vraag zonder correcte optie faalt.
4. RED: evaluatievraag vereist label/type/order.
5. RED: nieuwe cursusversie schrijft `CourseChangeLog`.
6. GREEN: actions + pure parsers implementeren.
7. UI: Academybeheer linkt naar concrete cursusregels of toont inline “beheer geselecteerde cursus” als eerste simpele versie.

### Acceptatiecriteria

- Vraagbank CRUD is minimaal bruikbaar en server-side bewaakt.
- Evaluatiebeheer schrijft echte `EvaluationQuestion` records.
- Accreditatie/publicatie blijft geblokkeerd als kritieke velden ontbreken.
- Acties maken waar relevant notificaties/change logs.

### Commit

`feat: add academy admin CRUD actions`

---

## Sprint 5 — Ingelogde E2E-test per rol

**Doel:** niet alleen unit/build groen, maar browser-flow per rol bewijzen.

### Belangrijk

Package heeft nu nog geen Playwright. Voeg alleen testdependency/config toe; geen echte wachtwoorden in code of chat.

### Bestanden

- Modify: `package.json`
- Create: `playwright.config.ts`
- Create: `tests/e2e/role-access.spec.ts`
- Create: `tests/e2e/helpers/auth.ts`
- Modify: `prisma/seed.ts` of create `prisma/test-seed.ts`

### Testaccounts

Gebruik veilige seedaccounts met lokaal bekende testwachtwoorden alleen in `.env.test` of testseed, niet in chat/final output. Rollen:

- `MEDEWERKER`
- `TEAMLEIDER`
- `PRAKTIJKMANAGER`
- `PRAKTIJKHOUDER`
- `BEHEERDER`
- `REVIEWER`

### E2E flows

1. Medewerker:
   - login;
   - ziet Academy/certificaten;
   - ziet geen `/praktijkbeheer` of `/academybeheer` nav.
2. Praktijkmanager:
   - login;
   - ziet `/praktijkbeheer`;
   - ziet geen persoonlijke Academy/ontwikkeling/LMS-flow.
3. Praktijkhouder:
   - login;
   - dashboard practice-first;
   - eigen certificaten blijven bereikbaar.
4. Beheerder:
   - login;
   - ziet `/academybeheer`, `/lms`, `/admin`;
   - kan beheeractiepagina openen.
5. Reviewer:
   - login;
   - heeft read-only preview;
   - geen muterende knoppen zichtbaar.
6. Meldingen:
   - na testseed/publicatie ziet relevante rol een badge/feeditem.

### Commands

```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
npx playwright test tests/e2e/role-access.spec.ts
```

### Acceptatiecriteria

- E2E draait lokaal headless.
- Geen productiecredentials nodig.
- Tests bewijzen nav/route-toegang én meldingenbadge.

### Commit

`test: add role based e2e coverage`

---

## Sprint 6 — Productie-validatie en smoke

**Doel:** alles veilig naar GitHub/Vercel, zonder aannames.

### Commands

```bash
node --import tsx --test tests/lib/notifications.test.ts tests/lib/deadline-notifications.test.ts tests/lib/practice-management-actions.test.ts tests/lib/lms/academy-admin-actions.test.ts tests/lib/academy-admin-cockpit.test.ts tests/lib/dashboard-role-fit.test.ts tests/lib/roles.test.ts tests/lib/practice-management.test.ts tests/lib/lms/route-access.test.ts
npm run lint
npm run build
npx playwright test tests/e2e/role-access.spec.ts

git status --short --branch
git add ...
git commit -m "feat: add persisted management flows and notifications"
git push

curl -I --max-time 20 -s https://fy-fit-academy.vercel.app/praktijkbeheer
curl -I --max-time 20 -s https://fy-fit-academy.vercel.app/academybeheer
```

### Verwacht

- Unit/focused tests groen.
- Lint groen.
- Build groen.
- E2E groen lokaal.
- Productie protected routes geven zonder sessie `307 -> /login`.

---

## Risico’s en mitigatie

1. **Prisma schema op productie:** code deploy is niet automatisch data/schema rollout. Eerst lokaal `prisma generate/build`, daarna bepalen of `db push/migrate` nodig is voor target DB.
2. **Server action auth:** geen UI-only beveiliging. Elke action begint met `requireRole`/helper.
3. **Notificatiespam:** maak notificaties op basis van bron/type uniek of dedupe in helper/action.
4. **Historische toetsdata:** delete van toetsvragen kan assessment attempts raken. Eerste versie: blokkeer verwijderen als er attempts zijn of kies soft-archive later.
5. **E2E secrets:** testaccounts via seed/env, niet hardcoded in documentatie of chat.
6. **Scope creep:** vandaag bouwen we bruikbare CRUD en signalen, geen complete enterprise notification engine.

---

## Aanbevolen volgorde vandaag

1. Sprint 0: schema safety.
2. Sprint 1: notificatiecentrum + badge/feed.
3. Sprint 2: mededelingen echt opslaan/publiceren.
4. Sprint 3: deadline- en course-signalen.
5. Sprint 4: Academybeheer CRUD verdiepen.
6. Sprint 5: E2E per rol.
7. Sprint 6: validatie, commit/push, smoke.

Als tijd krap wordt: eerst Sprint 0–3 afronden. Die leveren direct de meeste zichtbare waarde: echte mededelingen + meldingen/nieuws/info + deadline-iconen.
