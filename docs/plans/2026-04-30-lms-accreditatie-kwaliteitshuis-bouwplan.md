# LMS Accreditatie Kwaliteitshuis Fysiotherapie Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Fy-Fit Academy uitbreiden naar een accreditatie-waardig LMS dat e-learnings kan structureren, toetsen, evalueren, bewijzen/exporteren en reviewer-toegang biedt volgens de eisen van Kwaliteitshuis Fysiotherapie.

**Architecture:** De bestaande Academy blijft de voorkant voor medewerkers. Het bestaande LMS-datamodel in Prisma wordt uitgebreid met accreditatie-metadata, modules, leerdoel-koppelingen, toetsbank/randomisatie, evaluatie, reviewer-preview, wijzigingslogboek en rapportage/export. Beheerders krijgen contentbeheer; deelnemers krijgen een gecontroleerde leerflow; reviewers krijgen een geïsoleerde preview-flow zonder echte voortgangsdata te vervuilen.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma 7, PostgreSQL/Neon, Tailwind CSS 4, cookie-based HMAC auth, rollen MEDEWERKER/TEAMLEIDER/BEHEERDER plus nieuwe REVIEWER-rol.

---

## 0. Bron-eisen en scope

### Functionele eisen vanuit accreditatie

1. Algemene gegevens per e-learning:
   - Titel e-learning
   - Doelgroep: fysiotherapeuten / collega’s Fy-Fit
   - Register waarvoor accreditatie wordt aangevraagd
   - Vakinhoudelijk of beroepsgerelateerd
   - Totale studielast
   - Aantal modules
   - Auteur(s)/inhoudsdeskundige(n)
   - Versiedatum

2. Leerdoelen:
   - 3–6 concrete leerdoelen per e-learning
   - Formuleringen zoals: “Na afloop kan de deelnemer uitleggen…”, “klinisch redeneren bij…”, “toepassen…”
   - Leerdoelen op totaalniveau én module-niveau

3. Opbouw modules:
   - Per module: titel, duur, leerdoelen, inhoud, werkvorm, eventuele literatuur
   - Toetsvragen gekoppeld aan leerdoelen
   - Contentvormen: video, tekst, casus, reflectie, podcast
   - Les/contentblokken binnen modules mogelijk houden

4. Toetsing:
   - Toets na module of aan einde e-learning
   - Minimaal aantal MC-vragen passend bij duur
   - 70% juist = geslaagd
   - Maximaal 3 pogingen
   - Antwoordvolgorde randomiseren
   - Bij voorkeur vragenbank/toetscarrousel
   - Punten/certificaat pas na voldoende toets én afronding

5. Bewijs van afronding:
   - Naam deelnemer
   - BIG/KRF/SKF/registratienummer indien relevant
   - E-learning titel
   - Datum afronding
   - Score toets
   - Aantal pogingen
   - Behaalde status
   - Eventueel certificaat
   - Evaluatie ingevuld: ja/nee
   - Exporteerbaar

6. Evaluatie:
   - Niveau/diepgang
   - Relevantie voor praktijk
   - Toepasbaarheid
   - Kwaliteit leerstof
   - Toets passend bij leerstof
   - Geschatte vs. werkelijke studielast
   - Verbeterpunten

7. Beoordelaarstoegang:
   - Aparte rol: Accreditatiecommissie/reviewer-account
   - Toegang zonder betaling
   - Alle modules zichtbaar
   - Skipfunctie
   - Toets als preview
   - Inzicht in leerdoelen, literatuur en toetsopbouw
   - Geen verstoring van echte gebruikersdata

8. Extra systeemeisen:
   - LMS/leeromgeving met persoonlijke login
   - Duidelijke e-learningstructuur
   - Inhoud gekoppeld aan fysiotherapeutische competenties/richtlijnen
   - Literatuurlijst/richtlijnen
   - Versiebeheer per e-learning
   - Logboek van wijzigingen
   - Certificaat of deelnamebewijs
   - Rapportage per deelnemer

### Non-goals voor deze bouwronde

- Accreditatie-aanvraag zelf indienen bij externe instanties.
- Betalingen of externe betaalmuur.
- Complexe SCORM/xAPI-import.
- Volledige PDF-opmaak engine als eerste stap; export kan starten met CSV/HTML en later PDF.

---

## 1. Huidige uitgangssituatie in codebase

**Repo:** `/mnt/c/Users/Luuk Smeekens/fy-fit-academy`

Belangrijke bestaande bestanden:

- Datamodel: `prisma/schema.prisma`
- Seed-data LMS: `prisma/lms-seed-data.ts`, `prisma/seed.ts`
- Academy UI:
  - `src/app/(protected)/academy/page.tsx`
  - `src/app/(protected)/academy/[courseSlug]/page.tsx`
  - `src/app/(protected)/academy/[courseSlug]/lessons/[lessonSlug]/page.tsx`
  - `src/components/academy/*`
- LMS engine:
  - `src/lib/lms/queries.ts`
  - `src/lib/lms/types.ts`
  - `src/lib/lms/rules.ts`
  - `src/lib/lms/scoring.ts`
  - `src/lib/lms/certificates.ts`
  - `src/lib/lms/action-helpers.ts`
  - `src/app/lms-actions.ts`
  - `src/components/lms/assessment-runner.tsx`
- Auth/sessie:
  - `src/lib/auth.ts`
  - `src/lib/session.ts`
  - `src/proxy.ts`
- Admin basis:
  - `src/app/(protected)/admin/page.tsx`

Bestaand LMS bevat al Course, CourseVersion, Lesson, Enrollment, LessonProgress, Assessment, Question, QuestionOption, AssessmentAttempt, AssessmentAnswer en Certificate. De accreditatie-eisen vragen vooral om uitbreiding/verharding: metadata, module-laag, leerdoel-koppelingen, evaluaties, reviewer-sandbox, audit trail en rapportages.

---

## 2. Doelarchitectuur

### 2.1 Rollen

- `MEDEWERKER`: volgt gepubliceerde e-learnings via Academy.
- `TEAMLEIDER`: ziet teamrapportages en kan toewijzingen volgen.
- `BEHEERDER`: beheert e-learnings, accreditatiegegevens, toetsbanken, evaluaties, versies en exports.
- `REVIEWER`: accreditatiecommissie-account; alleen preview/toets-preview/skip, geen echte enrollment/progress/certificaat-mutaties.

### 2.2 Contentstructuur

Gewenste hiërarchie:

- Course / E-learning
  - Algemene accreditatiegegevens
  - Totale leerdoelen
  - Actieve CourseVersion
    - Modules
      - Module-leerdoelen
      - Lessen/contentblokken
      - Literatuur/richtlijnen
      - Competenties/richtlijnkoppelingen
      - Optionele moduletoets
    - Eindtoets
  - Evaluatieformulier
  - Certificaat/deelnamebewijs
  - Rapportage/export
  - Change log

### 2.3 Datastromen

- Beheerder maakt concept e-learning aan.
- Beheerder vult accreditatie-checklist aan tot alles compleet is.
- Beheerder publiceert versie.
- Medewerker volgt modules/lessen.
- Toetsing: max 3 pogingen, 70%-norm, random answer order, vragenbankselectie.
- Cursus voltooid als vereiste lessen/modules voltooid zijn, vereiste toets(en) voldoende zijn en — indien verplicht ingesteld — evaluatie is ingevuld.
- Certificaat/deelnamebewijs wordt uitgegeven na voltooiing.
- Reviewer bekijkt dezelfde inhoud in previewmodus zonder enrollments/progress/attempts/certificates aan te maken.

---

## 3. Sprintindeling

## Sprint 1 — Datamodel en accreditatiebasis

**Sprintdoel:** Prisma-schema uitbreiden zodat alle accreditatiegegevens, leerdoelen, modules, literatuur, competenties, evaluaties, reviewers en audit trail structureel opgeslagen kunnen worden.

### Task 1.1: Voeg REVIEWER rol toe

**Objective:** Reviewer-account technisch mogelijk maken zonder workarounds.

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/session.ts`
- Modify: eventuele role-unions in `src/lib/types.ts`, `src/lib/lms/types.ts`
- Test: nieuw of bestaand auth/type testbestand onder `tests/`

**Schema-aanpassing:**

```prisma
enum Role {
  MEDEWERKER
  TEAMLEIDER
  BEHEERDER
  REVIEWER
}
```

**Acceptatiecriteria:**
- REVIEWER kan als User.role bestaan.
- Bestaande rollen blijven werken.
- Routes voor medewerkers blijven beschermd.
- Reviewer krijgt geen beheerrechten behalve expliciete reviewer-preview routes.

**Verificatie:**
- `npx prisma format`
- `npm run db:generate`
- `npm run lint`

### Task 1.2: Breid Course uit met algemene accreditatiegegevens

**Objective:** E-learning bevat alle algemene gegevens die Kwaliteitshuis nodig heeft.

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/lms/types.ts`
- Modify: `src/lib/lms/queries.ts`
- Modify: `prisma/lms-seed-data.ts`
- Test: `tests/prisma/lms-seed-data.test.ts`

**Nieuwe velden op `Course`:**

```prisma
accreditationRegister String?
accreditationKind     AccreditationKind @default(VAKINHOUDELIJK)
versionDate           DateTime?
authorExperts         Json?
requiredQuestionCount Int?
```

**Nieuwe enum:**

```prisma
enum AccreditationKind {
  VAKINHOUDELIJK
  BEROEPSGERELATEERD
}
```

**JSON structuur `authorExperts`:**

```ts
type AuthorExpert = {
  name: string;
  role: string;
  organization?: string;
  registrationNumber?: string;
};
```

**Acceptatiecriteria:**
- Titel, doelgroep, register, soort, studielast, auteur(s), inhoudsdeskundigen en versiedatum zijn opslaanbaar.
- Aantal modules kan afgeleid worden uit modules in actieve versie; hoeft niet dubbel opgeslagen te worden.

### Task 1.3: Introduceer Module als LMS-laag tussen CourseVersion en Lesson

**Objective:** Modules expliciet modelleren met duur, leerdoelen, samenvatting, literatuur en werkvormen.

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/lms/types.ts`
- Modify: `src/lib/lms/queries.ts`
- Modify: `src/lib/academy/mappers.ts`
- Modify: Academy course/lesson components waar modulelijst getoond wordt

**Nieuwe modellen/enums:**

```prisma
enum WorkForm {
  VIDEO
  TEKST
  CASUS
  REFLECTIE
  PODCAST
  TOETS
  MIXED
}

model CourseModule {
  id               String        @id @default(cuid())
  courseVersionId  String
  title            String
  description      String?
  introduction     String?
  summary          String?
  order            Int
  estimatedMinutes Int           @default(0)
  workForms        WorkForm[]
  courseVersion    CourseVersion @relation(fields: [courseVersionId], references: [id])
  lessons          Lesson[]
  objectives       LearningObjective[]
  literature       LiteratureReference[]

  @@unique([courseVersionId, order])
}
```

**Wijzig `Lesson`:**

```prisma
moduleId String?
module   CourseModule? @relation(fields: [moduleId], references: [id])
```

**Acceptatiecriteria:**
- Elke cursusversie kan meerdere modules bevatten.
- Elke module heeft titel, duur, leerdoelen, inhoudsinleiding/samenvatting, werkvormen, literatuur.
- Bestaande courses zonder module migreren via seed/default naar één module.

### Task 1.4: Modelleer leerdoelen en koppelingen

**Objective:** Leerdoelen zijn herbruikbaar en toetsvragen kunnen eraan gekoppeld worden.

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/lms/types.ts`
- Modify: `src/lib/lms/queries.ts`
- Modify: `prisma/lms-seed-data.ts`
- Test: `tests/prisma/lms-seed-data.test.ts`

**Nieuw model:**

```prisma
model LearningObjective {
  id              String        @id @default(cuid())
  courseVersionId String
  moduleId        String?
  code            String
  text            String
  order           Int
  courseVersion   CourseVersion @relation(fields: [courseVersionId], references: [id])
  module          CourseModule? @relation(fields: [moduleId], references: [id])
  questions       QuestionLearningObjective[]

  @@unique([courseVersionId, code])
}

model QuestionLearningObjective {
  questionId          String
  learningObjectiveId String
  question            Question          @relation(fields: [questionId], references: [id])
  learningObjective   LearningObjective @relation(fields: [learningObjectiveId], references: [id])

  @@id([questionId, learningObjectiveId])
}
```

**Acceptatiecriteria:**
- Per e-learning 3–6 concrete leerdoelen afdwingbaar via validatie.
- Per module minimaal één gekoppeld leerdoel.
- Iedere toetsvraag moet minimaal één leerdoelkoppeling kunnen hebben.

### Task 1.5: Modelleer literatuur, richtlijnen en competenties

**Objective:** Inhoud aantoonbaar koppelen aan fysiotherapeutische competenties/richtlijnen.

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/lms/types.ts`
- Modify: `src/lib/lms/queries.ts`
- Modify: admin UI later in Sprint 2

**Nieuwe modellen:**

```prisma
model LiteratureReference {
  id              String        @id @default(cuid())
  courseVersionId String
  moduleId        String?
  title           String
  source          String?
  url             String?
  guideline       String?
  year            Int?
  order           Int
  courseVersion   CourseVersion @relation(fields: [courseVersionId], references: [id])
  module          CourseModule? @relation(fields: [moduleId], references: [id])
}

model CompetencyReference {
  id              String        @id @default(cuid())
  courseVersionId String
  moduleId        String?
  name            String
  framework       String?
  description     String?
  courseVersion   CourseVersion @relation(fields: [courseVersionId], references: [id])
  module          CourseModule? @relation(fields: [moduleId], references: [id])
}
```

**Acceptatiecriteria:**
- Literatuurlijst/richtlijnen zichtbaar op cursus- en moduleniveau.
- Competenties kunnen in reviewer-overzicht getoond worden.

### Task 1.6: Modelleer evaluatieformulieren en antwoorden

**Objective:** Evaluatiegegevens kunnen standaard na afronding worden ingevuld en gerapporteerd.

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/lms/types.ts`
- Test: nieuwe evaluatie tests

**Nieuwe modellen/enums:**

```prisma
enum EvaluationQuestionType {
  SCALE_1_5
  TEXT
  YES_NO
}

model EvaluationForm {
  id              String        @id @default(cuid())
  courseVersionId String
  title           String
  isRequired      Boolean       @default(true)
  courseVersion   CourseVersion @relation(fields: [courseVersionId], references: [id])
  questions       EvaluationQuestion[]
  submissions     EvaluationSubmission[]
}

model EvaluationQuestion {
  id               String                 @id @default(cuid())
  evaluationFormId String
  label            String
  type             EvaluationQuestionType
  order            Int
  isRequired       Boolean                @default(true)
  evaluationForm   EvaluationForm         @relation(fields: [evaluationFormId], references: [id])
  answers          EvaluationAnswer[]
}

model EvaluationSubmission {
  id               String             @id @default(cuid())
  evaluationFormId String
  userId           String
  submittedAt      DateTime           @default(now())
  actualStudyMinutes Int?
  evaluationForm   EvaluationForm     @relation(fields: [evaluationFormId], references: [id])
  user             User               @relation(fields: [userId], references: [id])
  answers          EvaluationAnswer[]

  @@unique([evaluationFormId, userId])
}

model EvaluationAnswer {
  id                     String               @id @default(cuid())
  evaluationSubmissionId String
  evaluationQuestionId   String
  rating                 Int?
  text                   String?
  booleanValue           Boolean?
  submission             EvaluationSubmission @relation(fields: [evaluationSubmissionId], references: [id])
  question               EvaluationQuestion   @relation(fields: [evaluationQuestionId], references: [id])
}
```

**Standaard evaluatievragen:**
- Niveau/diepgang
- Relevantie voor praktijk
- Toepasbaarheid
- Kwaliteit leerstof
- Toets passend bij leerstof
- Geschatte vs. werkelijke studielast
- Verbeterpunten

### Task 1.7: Modelleer audit trail / logboek van wijzigingen

**Objective:** Versiebeheer en wijzigingslogboek aantoonbaar maken.

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: toekomstige admin actions

**Nieuw model:**

```prisma
model CourseChangeLog {
  id              String        @id @default(cuid())
  courseId        String
  courseVersionId String?
  changedById     String
  changedAt       DateTime      @default(now())
  changeType      String
  summary         String
  details         Json?
  course          Course        @relation(fields: [courseId], references: [id])
  courseVersion   CourseVersion? @relation(fields: [courseVersionId], references: [id])
  changedBy       User          @relation(fields: [changedById], references: [id])
}
```

**Acceptatiecriteria:**
- Publiceren, nieuwe versie, wijziging toets, wijziging leerdoelen, wijziging literatuur en archive acties worden gelogd.

---

## Sprint 2 — Beheeromgeving en accreditatie-checklist

**Sprintdoel:** Beheerders kunnen e-learningstructuur en accreditatiegegevens beheren zonder code/seed-bestanden.

### Task 2.1: Maak admin LMS routestructuur

**Files:**
- Create: `src/app/(protected)/admin/lms/page.tsx`
- Create: `src/app/(protected)/admin/lms/courses/new/page.tsx`
- Create: `src/app/(protected)/admin/lms/courses/[courseId]/page.tsx`
- Create: `src/app/(protected)/admin/lms/courses/[courseId]/edit/page.tsx`
- Create: `src/app/(protected)/admin/lms/courses/[courseId]/versions/[versionId]/page.tsx`
- Create: `src/app/(protected)/admin/lms/courses/[courseId]/reports/page.tsx`
- Modify: `src/app/(protected)/admin/page.tsx`

**Acceptatiecriteria:**
- Alleen BEHEERDER kan deze routes openen.
- Admin dashboard toont LMS beheerkaart.

### Task 2.2: Course metadata formulier

**Objective:** Algemene gegevens invullen/wijzigen.

**Fields:**
- Titel
- Slug
- Omschrijving
- Doelgroep
- Register
- Vakinhoudelijk/beroepsgerelateerd
- Totale studielast
- Auteur(s)/inhoudsdeskundige(n)
- Versiedatum
- Verplichte cursus ja/nee
- Revisiedatum

**Files:**
- Create: `src/components/admin/lms/course-metadata-form.tsx`
- Create/modify: `src/app/admin-lms-actions.ts` of uitbreiden `src/app/lms-actions.ts` met admin-only acties
- Modify: `src/lib/lms/queries.ts`

**Acceptatiecriteria:**
- Validatie: titel, doelgroep, register, soort, studielast en versiedatum verplicht voor publicatie.
- Wijziging schrijft CourseChangeLog.

### Task 2.3: Leerdoelenbeheer

**Objective:** 3–6 leerdoelen op cursusniveau en moduleleerdoelen beheren.

**Files:**
- Create: `src/components/admin/lms/learning-objectives-editor.tsx`
- Modify: admin actions
- Modify: `src/lib/lms/queries.ts`

**Validatie:**
- Cursus: minimaal 3, maximaal 6 leerdoelen voor publicatie.
- Module: minimaal 1 leerdoel voor publicatie.
- Leerdoeltekst moet beginnen met of passen bij “Na afloop kan de deelnemer…” format; hard afdwingen als waarschuwing of helpertekst, niet als blokkade als beheerder bewust afwijkt.

### Task 2.4: Modulebeheer

**Objective:** Modules aanmaken, sorteren en vullen.

**Files:**
- Create: `src/components/admin/lms/modules-editor.tsx`
- Create: `src/components/admin/lms/module-form.tsx`
- Modify: `src/lib/lms/queries.ts`
- Modify: admin actions

**Fields per module:**
- Titel
- Duur
- Leerdoelen
- Inleiding
- Lessen/contentblokken
- Samenvatting
- Werkvormen
- Literatuur/richtlijnen
- Competenties

**Acceptatiecriteria:**
- Modules sorteerbaar via order.
- Totaal moduleduur moet zichtbaar vergeleken worden met totale studielast.

### Task 2.5: Les/contentblokbeheer

**Objective:** Binnen modules lessen/contentblokken kunnen beheren.

**Files:**
- Create: `src/components/admin/lms/lessons-editor.tsx`
- Create: `src/components/admin/lms/lesson-form.tsx`
- Modify: bestaande Lesson queries/actions

**Contenttypes:**
- TEXT
- VIDEO
- DOCUMENT
- CASE
- REFLECTION
- ASSESSMENT
- PODCAST toevoegen aan enum of via WorkForm tonen

**Acceptatiecriteria:**
- Les heeft titel, type, inhoud, duur, volgorde en verplicht/optioneel.
- Academy toont module > lessen logisch.

### Task 2.6: Accreditatie-checklist component

**Objective:** Beheerder ziet vóór publicatie welke eisen compleet/onvolledig zijn.

**Files:**
- Create: `src/lib/lms/accreditation-checklist.ts`
- Create: `src/components/admin/lms/accreditation-checklist-panel.tsx`
- Test: `tests/lms/accreditation-checklist.test.ts`

**Checklistregels:**
- Algemene gegevens volledig
- 3–6 leerdoelen
- Minimaal 1 module
- Elke module heeft titel, duur, leerdoel, inhoud/samenvatting, werkvorm
- Literatuur/richtlijnen ingevuld
- Toets aanwezig of expliciet niet vereist
- Toets heeft minimaal passend aantal MC-vragen
- Iedere toetsvraag gekoppeld aan leerdoel
- 70%-norm ingesteld
- Max 3 pogingen
- Randomisatie antwoordvolgorde aan
- Evaluatieformulier aanwezig
- Certificaat/deelnamebewijs mogelijk
- Reviewer-preview beschikbaar
- Versiedatum en wijzigingslog aanwezig

**Acceptatiecriteria:**
- Publiceren blokkeert bij kritieke fouten.
- Niet-kritieke waarschuwingen blijven zichtbaar.

---

## Sprint 3 — Toetsbank, toetscarrousel en harde toetsregels

**Sprintdoel:** Toetsing voldoet aantoonbaar aan accreditatie-eisen.

### Task 3.1: Voeg vraagbankvelden toe

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/lms/types.ts`

**Aanvullingen op `Question`:**

```prisma
moduleId       String?
learningLevel  String?
isActive       Boolean @default(true)
```

**Aanvullingen op `Assessment`:**

```prisma
questionPoolSize Int?
```

**Acceptatiecriteria:**
- Een toets kan meer vragen in de bank hebben dan getoond wordt.
- Toets kan random subset selecteren.

### Task 3.2: Bouw question bank editor

**Files:**
- Create: `src/components/admin/lms/question-bank-editor.tsx`
- Create: `src/components/admin/lms/question-form.tsx`
- Modify: admin actions

**Fields per vraag:**
- Vraagtekst
- Type, primair MC voor accreditatie
- Antwoordopties
- Correct antwoord
- Uitleg
- Leerdoel-koppelingen
- Module-koppeling
- Actief ja/nee
- Punten

**Acceptatiecriteria:**
- Vraag zonder leerdoel kan niet actief gepubliceerd worden.
- MC-vraag heeft minimaal 2 opties en minimaal 1 correct antwoord.

### Task 3.3: Randomiseer antwoordvolgorde bij renderen

**Files:**
- Modify: `src/components/lms/assessment-runner.tsx`
- Modify: `src/lib/lms/assessment-runner-helpers.ts`
- Test: `tests/lms/assessment-runner-helpers.test.ts`

**Acceptatiecriteria:**
- Antwoordvolgorde wordt per poging/random seed anders getoond als `shuffleOptions=true`.
- Correctheidscontrole blijft gebaseerd op option IDs, niet op positie.

### Task 3.4: Implementeer vragenbankselectie/toetscarrousel

**Files:**
- Modify: `src/lib/lms/queries.ts`
- Modify: `src/app/lms-actions.ts`
- Create: `src/lib/lms/question-selection.ts`
- Test: `tests/lms/question-selection.test.ts`

**Regels:**
- Als `questionPoolSize` gezet is: selecteer random actieve vragen uit bank.
- Selectie opslaan bij poging zodat poging reproduceerbaar blijft.
- Hiervoor `AssessmentAttempt` uitbreiden met `questionOrder Json?`.

**Acceptatiecriteria:**
- Dezelfde poging toont altijd dezelfde geselecteerde vragen.
- Nieuwe poging mag andere vragen tonen.

### Task 3.5: Borg 70%-norm en max 3 pogingen

**Files:**
- Modify: `src/app/lms-actions.ts`
- Modify: `src/lib/lms/scoring.ts`
- Test: `tests/lms/scoring.test.ts`

**Acceptatiecriteria:**
- `passPercentage` default en publicatie-eis = 70.
- `maxAttempts` default en publicatie-eis = 3.
- Vierde poging onmogelijk voor echte deelnemers.
- Reviewer-preview valt buiten poginglimiet en schrijft geen poging.

---

## Sprint 4 — Deelnemerflow, evaluatie en certificaat/deelnamebewijs

**Sprintdoel:** Medewerker kan e-learning afronden volgens regels en krijgt bewijs van afronding.

### Task 4.1: Update Academy course detail naar module-structuur

**Files:**
- Modify: `src/app/(protected)/academy/[courseSlug]/page.tsx`
- Modify: `src/components/academy/academy-lesson-list.tsx`
- Modify: `src/components/academy/academy-course-intro.tsx`
- Modify: `src/components/academy/academy-course-hero.tsx`

**Acceptatiecriteria:**
- Course toont doel, focus, 3–6 leerdoelen, doelgroep, studielast, modules.
- Per module zichtbaar: titel, duur, leerdoelen, werkvormen, literatuur indien aanwezig.

### Task 4.2: Update lespagina naar modulecontext

**Files:**
- Modify: `src/app/(protected)/academy/[courseSlug]/lessons/[lessonSlug]/page.tsx`
- Modify: `src/components/academy/academy-lesson-sidebar.tsx`

**Acceptatiecriteria:**
- Sidebar groepeert lessen onder modules.
- Module-inleiding en samenvatting logisch zichtbaar.
- Reflectie/casus/podcast contenttypes helder weergegeven.

### Task 4.3: Evaluatieformulier na afronding

**Files:**
- Create: `src/app/(protected)/academy/[courseSlug]/evaluation/page.tsx`
- Create: `src/components/academy/evaluation-form.tsx`
- Modify: `src/app/lms-actions.ts`
- Modify: `src/lib/lms/rules.ts`

**Acceptatiecriteria:**
- Evaluatie verschijnt na voldoen aan lessen/toets of als laatste afrondstap.
- Antwoorden worden opgeslagen.
- `EvaluationSubmission` telt mee in afrondingsbewijs.
- Als evaluatie required is, certificaat pas na evaluatie.

### Task 4.4: Certificaat/deelnamebewijs uitbreiden

**Files:**
- Modify: `src/lib/lms/certificates.ts`
- Modify: `prisma/schema.prisma`
- Create: `src/app/(protected)/academy/certificates/[certificateId]/page.tsx`
- Create: `src/components/academy/certificate-view.tsx`

**Uitbreiding Certificate:**

```prisma
participantName     String?
registrationNumber  String?
completedAt         DateTime?
attemptCount        Int?
evaluationCompleted Boolean @default(false)
```

**Acceptatiecriteria:**
- Bewijs toont naam, registratienummer indien gevuld, titel, datum, score, pogingenaantal, status, evaluatie ja/nee, studielast, versie.
- CertificateCode blijft uniek.

### Task 4.5: Registratienummers bij gebruiker

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/app/(protected)/mijn-gegevens/page.tsx`
- Modify: relevante user forms/actions

**Aanvullingen User:**

```prisma
bigNumber String?
krfNumber String?
skfNumber String?
```

**Acceptatiecriteria:**
- Gebruiker/beheerder kan nummers vastleggen.
- Bewijs gebruikt relevante nummers indien aanwezig.

---

## Sprint 5 — Reviewer-account en accreditatiepreview

**Sprintdoel:** Accreditatiecommissie kan alles inspecteren zonder echte data te vervuilen.

### Task 5.1: Reviewer route-access isoleren

**Files:**
- Modify: `src/lib/lms/route-access.ts`
- Modify: `src/proxy.ts`
- Create: `src/lib/lms/reviewer-mode.ts`
- Test: route-access tests indien aanwezig/nieuw

**Acceptatiecriteria:**
- REVIEWER mag alleen reviewer-preview routes en eigen profiel/login.
- REVIEWER kan niet in admin bewerken.
- REVIEWER creëert geen Enrollment, LessonProgress, AssessmentAttempt, Certificate of EvaluationSubmission.

### Task 5.2: Reviewer overzichtspagina

**Files:**
- Create: `src/app/(protected)/reviewer/page.tsx`
- Create: `src/app/(protected)/reviewer/courses/[courseId]/page.tsx`
- Create: `src/components/reviewer/reviewer-course-overview.tsx`

**Toont:**
- Algemene gegevens
- Accreditatie-checkliststatus
- Leerdoelen
- Modules met duur/werkvorm/literatuur
- Toetsopbouw: aantal vragen, leerdoelkoppelingen, pass norm, max pogingen, randomisatie
- Evaluatievragen
- Versiegegevens en change log

### Task 5.3: Skipfunctie voor reviewer

**Files:**
- Create: `src/app/(protected)/reviewer/courses/[courseId]/modules/[moduleId]/page.tsx`
- Create: `src/app/(protected)/reviewer/courses/[courseId]/lessons/[lessonId]/page.tsx`
- Create: `src/components/reviewer/reviewer-navigation.tsx`

**Acceptatiecriteria:**
- Reviewer kan elke module/les direct openen.
- UI toont “Previewmodus — voortgang wordt niet opgeslagen”.

### Task 5.4: Toets-preview voor reviewer

**Files:**
- Create: `src/app/(protected)/reviewer/courses/[courseId]/assessments/[assessmentId]/page.tsx`
- Create: `src/components/reviewer/reviewer-assessment-preview.tsx`
- Reuse waar veilig: `src/components/lms/assessment-runner.tsx` alleen als read-only/preview mode toegevoegd kan worden

**Acceptatiecriteria:**
- Reviewer kan vragen, antwoordopties, correcte antwoorden, uitleg en leerdoelkoppelingen zien.
- Geen attempt wordt aangemaakt.

---

## Sprint 6 — Rapportage en export

**Sprintdoel:** Beheerders/teamleiders kunnen bewijs van afronding en deelnemerrapportage exporteren.

### Task 6.1: Rapportagequery per deelnemer

**Files:**
- Create: `src/lib/lms/reports.ts`
- Test: `tests/lms/reports.test.ts`

**Rapportagevelden:**
- Naam deelnemer
- BIG/KRF/SKF/registratienummer
- E-learning titel
- Versie
- Datum start
- Datum afronding
- Score toets
- Aantal pogingen
- Behaalde status
- Certificaatcode/link
- Evaluatie ingevuld ja/nee
- Studielast

### Task 6.2: Admin rapportagepagina

**Files:**
- Create: `src/app/(protected)/admin/lms/reports/page.tsx`
- Create: `src/components/admin/lms/reports-table.tsx`
- Create: `src/components/admin/lms/report-filters.tsx`

**Filters:**
- E-learning
- Status
- Team/locatie
- Datumrange
- Evaluatie ingevuld ja/nee

### Task 6.3: CSV-export

**Files:**
- Create: `src/app/(protected)/admin/lms/reports/export/route.ts`
- Create: `src/lib/lms/csv.ts`
- Test: `tests/lms/csv.test.ts`

**Acceptatiecriteria:**
- Export bevat exact de bewijsvelden.
- Alleen BEHEERDER en eventueel TEAMLEIDER scoped naar team.

### Task 6.4: Certificaat/deelnamebewijs print/export

**Files:**
- Modify: `src/app/(protected)/academy/certificates/[certificateId]/page.tsx`
- Create: `src/app/(protected)/admin/lms/certificates/[certificateId]/page.tsx`

**Acceptatiecriteria:**
- Printvriendelijke certificaatpagina.
- Later uitbreidbaar naar PDF.

---

## Sprint 7 — Publicatie, versiebeheer en governance

**Sprintdoel:** E-learningversies kunnen veilig gepubliceerd en beheerd worden zonder bestaande deelnemersdata te breken.

### Task 7.1: Publicatieflow met checklist-gate

**Files:**
- Modify: admin actions
- Modify: `src/lib/lms/accreditation-checklist.ts`
- Create: `src/components/admin/lms/publish-course-button.tsx`

**Acceptatiecriteria:**
- Publiceren kan alleen als kritieke checklist-items groen zijn.
- Publicatie schrijft `publishedAt`, `versionDate`, active version en CourseChangeLog.

### Task 7.2: Nieuwe versie maken

**Files:**
- Create: `src/lib/lms/versioning.ts`
- Create: `src/components/admin/lms/create-version-button.tsx`
- Test: `tests/lms/versioning.test.ts`

**Regels:**
- Nieuwe versie kopieert modules, lessen, leerdoelen, literatuur, toetsen en evaluatieformulier.
- Oude certificaten blijven aan oude CourseVersion gekoppeld.
- Slechts één actieve versie tegelijk.

### Task 7.3: Change log zichtbaar maken

**Files:**
- Create: `src/components/admin/lms/change-log-panel.tsx`
- Modify: admin course detail page
- Modify: reviewer overview page

**Acceptatiecriteria:**
- Reviewer ziet wijzigingslogboek.
- Beheerder ziet wie/wat/wanneer.

---

## Sprint 8 — Testen, seed-data, polish en deployment

**Sprintdoel:** Betrouwbaar opleveren, seed-demo accreditatie-ready maken en productie deployen.

### Task 8.1: Seed-data accreditatie-ready maken

**Files:**
- Modify: `prisma/lms-seed-data.ts`
- Modify: `prisma/seed.ts`
- Modify: `tests/prisma/lms-seed-data.test.ts`

**Acceptatiecriteria:**
- Demo e-learning bevat alle vereiste accreditatievelden.
- Demo bevat modules, leerdoelen, literatuur, toetsvragen met leerdoelkoppelingen, evaluatieformulier en certificaatfixture.

### Task 8.2: End-to-end acceptatiecheck handmatig script

**Files:**
- Create: `docs/checklists/lms-accreditatie-acceptatiecheck.md`

**Checklist:**
- Login als beheerder
- Maak e-learning compleet
- Publiceer
- Login als medewerker
- Doorloop lessen/modules
- Maak toets: gezakt/geslaagd scenario
- Vul evaluatie in
- Controleer certificaat
- Login als reviewer
- Preview zonder dat data wijzigt
- Export rapportage

### Task 8.3: Verificatiecommands

Run vanaf repo-root:

```bash
npm run lint
npm run db:generate
npm run build
```

Let op: repo draait onder `/mnt/c`; Prisma/Next build kan in WSL soms filesystem/EPERM issues geven. Als build faalt op Prisma engine copy, onderscheid app-code fout van WSL filesystem fout.

### Task 8.4: GitHub en Vercel deployment

**Commands:**

```bash
git status --short
git add prisma src tests docs package.json package-lock.json
git commit -m "feat: make LMS accreditation-ready"
git push origin main
```

Daarna Vercel deployment controleren via project:
`https://vercel.com/luuksmeekens94-6788s-projects/fy-fit-academy`

---

## 4. Definition of Done per eis

### Algemene gegevens

Done wanneer beheerder per e-learning kan invullen en reviewer kan zien:
- Titel
- Doelgroep
- Register
- Vakinhoudelijk/beroepsgerelateerd
- Totale studielast
- Aantal modules
- Auteur(s)/inhoudsdeskundige(n)
- Versiedatum

### Leerdoelen

Done wanneer:
- 3–6 leerdoelen op e-learningniveau bestaan.
- Moduleleerdoelen bestaan.
- Toetsvragen aan leerdoelen gekoppeld zijn.

### Opbouw modules

Done wanneer per module beschikbaar is:
- Titel
- Duur
- Leerdoel(en)
- Inhoud/inleiding/lessen/samenvatting
- Werkvorm
- Literatuur/richtlijnen
- Toetsvragen gekoppeld aan leerdoelen

### Toetsing

Done wanneer:
- Moduletoets of eindtoets mogelijk is.
- 70%-norm default/vereist is.
- Max 3 pogingen geldt.
- Antwoordvolgorde randomiseert.
- Vragenbank/toetscarrousel werkt.
- Certificaat pas na voldoende toets + afronding + required evaluatie komt.

### Bewijs van afronding

Done wanneer bewijs/export bevat:
- Naam
- BIG/KRF/SKF indien relevant
- E-learning titel
- Datum afronding
- Score
- Pogingen
- Status
- Certificaat/deelnamebewijs
- Evaluatie ingevuld ja/nee

### Evaluatie

Done wanneer standaard evaluatieformulier bestaat met:
- Niveau/diepgang
- Relevantie praktijk
- Toepasbaarheid
- Kwaliteit leerstof
- Toets passend bij leerstof
- Geschatte vs werkelijke studielast
- Verbeterpunten

### Reviewer-account

Done wanneer REVIEWER:
- Kan inloggen
- Alle modules kan bekijken
- Kan skippen
- Toets preview kan zien
- Leerdoelen/literatuur/toetsopbouw ziet
- Geen echte gebruikersdata wijzigt

### Versiebeheer en wijzigingslogboek

Done wanneer:
- CourseVersion actief/inactief correct werkt.
- Nieuwe versie oude certificaten niet beïnvloedt.
- Belangrijke wijzigingen in CourseChangeLog staan.

### Rapportage per deelnemer

Done wanneer:
- Admin rapportage per deelnemer zichtbaar is.
- CSV-export beschikbaar is.
- Teamleider scoped rapportage mogelijk is of expliciet alleen admin in v1.

---

## 5. Risico’s en keuzes

### Risico 1: Datamodel-migratie op bestaande productiegegevens

**Mitigatie:**
- Nieuwe velden nullable of met defaults starten.
- Eerst `prisma db push`/migratie testen op preview DB.
- Seed aanpassen na schema.

### Risico 2: Reviewer mag geen data vervuilen

**Mitigatie:**
- Reviewer routes apart houden onder `/reviewer`.
- Reviewer acties read-only maken.
- Tests die bewijzen dat reviewer geen Enrollment/Attempt/Progress aanmaakt.

### Risico 3: Vragenbankselectie reproduceerbaar maken

**Mitigatie:**
- Selectie per poging opslaan in `AssessmentAttempt.questionOrder`.
- Scoring op opgeslagen vraagset baseren.

### Risico 4: Accreditatie-eisen veranderen

**Mitigatie:**
- Checklistregels centraliseren in `src/lib/lms/accreditation-checklist.ts`.
- Velden generiek genoeg houden: register, soort, richtlijnen, competenties, change log.

---

## 6. Aanbevolen uitvoervolgorde

1. Sprint 1 volledig afronden en datamodel genereren.
2. Sprint 2 admin beheer + checklist bouwen.
3. Sprint 3 toetsing hard maken.
4. Sprint 4 deelnemerflow/certificaat/evaluatie afronden.
5. Sprint 5 reviewer-preview isoleren.
6. Sprint 6 rapportage/export.
7. Sprint 7 versiebeheer/governance.
8. Sprint 8 testen, seed, deploy.

Niet parallel starten met Sprint 3–6 vóór Sprint 1 schema staat; anders snij je jezelf in de vingers — en dat mag alleen als het didactisch verantwoord is.

---

## 7. Sprintbacklog compact

### Sprint 1 backlog
- REVIEWER rol
- Course accreditatievelden
- CourseModule model
- LearningObjective model + vraagkoppelingen
- LiteratureReference + CompetencyReference
- EvaluationForm + submissions
- CourseChangeLog

### Sprint 2 backlog
- Admin LMS routes
- Metadata formulier
- Leerdoelen editor
- Module editor
- Lesson/content editor
- Accreditatie-checklist

### Sprint 3 backlog
- Vraagbankvelden
- Vraagbank editor
- Antwoordrandomisatie
- Vragenbankselectie
- Poginglimiet/norm tests

### Sprint 4 backlog
- Academy module UI
- Lespagina modulecontext
- Evaluatieflow
- Certificaat/deelnamebewijs
- Registratienummers gebruiker

### Sprint 5 backlog
- Reviewer route-access
- Reviewer overzicht
- Reviewer skipfunctie
- Toets-preview

### Sprint 6 backlog
- Rapportagequeries
- Rapportagepagina
- CSV-export
- Printbaar bewijs

### Sprint 7 backlog
- Publicatie gate
- Nieuwe versie flow
- Change log UI

### Sprint 8 backlog
- Accreditatie-ready seed
- Acceptatiecheck document
- Lint/build/db-generate
- Commit/push/deploy

---

## 8. Eerste implementatietaak voor volgende sessie

Start met Sprint 1, Task 1.1 en 1.2:

1. Maak branch: `feat/lms-accreditatie-ready`
2. Pas `prisma/schema.prisma` aan met REVIEWER en Course-accreditatievelden.
3. Update types/queries/seed-data.
4. Voeg tests toe voor seed completeness.
5. Run:

```bash
npx prisma format
npm run db:generate
npm run lint
```

Na groen resultaat commit:

```bash
git add prisma src tests docs
git commit -m "feat: add LMS accreditation metadata foundation"
```
