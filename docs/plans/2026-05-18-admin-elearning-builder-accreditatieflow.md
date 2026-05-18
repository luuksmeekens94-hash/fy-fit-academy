# Admin E-learning Builder + Accreditatieflow Implementation Plan

> **For Hermes:** Use subagent-driven-development skill for follow-up execution when the sprint is split across multiple implementation agents.

**Goal:** Maak de Fy-Fit Academy adminflow geschikt om zonder code een accreditatiewaardige e-learning te bouwen, controleren, reviewen, exporteren en publiceren voor Kwaliteitshuis Fysiotherapie.

**Architecture:** Bouw voort op het bestaande LMS-datamodel, de bestaande accreditatiechecklist, evidence-export, reviewer-preview en server actions. Verbeter eerst de bestaande accreditatiecockpit naar een duidelijke builder-cockpit; voeg daarna stap-voor-stap echte authoring acties toe voor lessen, media en toetsbankbeheer.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma 7/PostgreSQL, Tailwind CSS 4, server actions, Playwright E2E.

---

## Scope voor vandaag

Vandaag pakken we de platform- en proceslaag aan, los van de inhoud van één specifieke e-learning.

### Must-have vandaag

1. Plan vastleggen in `docs/plans/`.
2. Bestaande accreditatiecockpit omvormen naar een duidelijker admin-builder cockpit.
3. Harde indienvelden zichtbaar maken:
   - register;
   - soort scholing;
   - aanbieder;
   - ondertekenaar deelnamebewijs;
   - activiteit-ID/PE-online ID;
   - auteur(s)/inhoudsdeskundige(n);
   - versiedatum;
   - revisiedatum;
   - totale studielast.
4. Server actions aanpassen zodat deze harde indienvelden ook echt opgeslagen en gevalideerd worden.
5. Checklist/publish gate voeden met deze velden, zodat de cockpit geen vals groen of vals rood geeft.
6. Live accreditatiebegeleiding duidelijker maken met blokkades, waarschuwingen, stappen en dossierstatus.
7. Leerdoel-toets-matrix visueler maken.
8. Modulekaarten praktischer maken voor adminreview.
9. Dossier/export duidelijk presenteren als één indienpakket.
10. Validatie draaien: minimaal typecheck/lint/build of de best beschikbare scripts.

### Niet volledig vandaag, wel voorbereiden

Deze onderdelen zijn groter en krijgen aparte fases:

- echte drag/drop module-builder;
- losse lesson/contentblock CRUD-actions;
- echte video-upload naar Vercel Blob/Cloudflare R2/S3;
- volledige toetsbank-editor met vraag/antwoord CRUD;
- PDF-export naast Markdown/CSV;
- bulkimport vanuit Word/Markdown/CSV.

---

## Functionele doelarchitectuur

## Stap 1 — Basis

Admin ziet en beheert:

- titel;
- korte omschrijving;
- doelgroepomschrijving;
- doelgroepprofiel:
  - fysiotherapeut;
  - praktijkondersteuner;
  - fitcoach;
- zichtbaar voor rollen;
- zichtbaar voor specifieke accounts;
- prioriteit: Need to know / Nice to know onder water gekoppeld aan verplicht/aanbevolen;
- status:
  - concept;
  - klaar voor review;
  - gepubliceerd;
  - gearchiveerd.

## Stap 2 — Accreditatiegegevens

Admin ziet en beheert als harde indienvelden:

- register;
- soort scholing:
  - vakinhoudelijk;
  - beroepsgerelateerd;
- aanbieder;
- ondertekenaar deelnamebewijs;
- activiteit-ID/PE-online ID;
- auteur(s);
- inhoudsdeskundige(n);
- versiedatum;
- revisiedatum;
- totale studielast.

Acceptatiecriteria:

- Deze velden staan bovenaan of in een duidelijke stap, niet verstopt in een generiek tekstvak.
- Ontbrekende velden verschijnen als live blokkade.
- Publish server action blokkeert als kritieke velden ontbreken.

## Stap 3 — Modules visueel beheren

Per modulekaart zichtbaar:

- moduletitel;
- korte omschrijving;
- introductie;
- samenvatting;
- geschatte duur;
- werkvormen:
  - video;
  - tekst;
  - casus;
  - reflectie;
  - toets;
  - podcast;
  - document;
- gekoppelde leerdoelen;
- gekoppelde literatuur;
- gekoppelde competenties;
- lessen binnen module.

Gewenste acties:

- module toevoegen;
- module dupliceren;
- omhoog/omlaag verplaatsen;
- module verwijderen;
- bekijk als deelnemer.

Voor vandaag tonen we modulekaarten en readiness. CRUD-actions volgen in fase 2.

## Stap 4 — Lessen/contentblokken

Per module moeten later blokken toegevoegd kunnen worden:

- tekstles;
- video;
- document;
- casus;
- reflectieopdracht;
- toets;
- afsluiting/evaluatie.

Voor video’s:

- video uploaden of URL toevoegen;
- titel;
- omschrijving;
- duur in minuten;
- transcript/samenvatting optioneel;
- koppeling aan leerdoelen;
- telt mee voor studielast ja/nee;
- afgedekt door toets/opdracht ja/nee.

Voor vandaag: zichtbaar maken welke lessen/media nu ontbreken en welke volgende authoringactie nodig is.

## Stap 5 — Leerdoelenbeheer

Admin krijgt:

- duidelijke teller: `x van 3–6 leerdoelen`;
- helpertekst: “Formuleer als: Na afloop kan de deelnemer…”;
- waarschuwing bij minder dan 3 of meer dan 6;
- visuele mapping:
  - leerdoel → module;
  - leerdoel → toetsdekking;
  - leerdoel → content/lessen.

## Stap 6 — Toetsbankbeheer

Doelstructuur:

- vraagtekst;
- vraagtype:
  - multiple choice;
  - multiple response;
  - true/false;
- antwoordopties;
- juiste antwoord(en);
- feedback/uitleg;
- gekoppelde leerdoelen;
- gekoppelde module;
- actief ja/nee;
- punten;
- randomisatie.

Cockpit toont altijd:

- aantal vragen totaal;
- aantal vragen per module;
- aantal vragen per leerdoel;
- slagingsnorm;
- max pogingen;
- randomisatie aan/uit;
- vraagminimum volgens studielast.

## Stap 7 — Literatuur/richtlijnen/competenties

Admin kan toevoegen:

### Literatuur

- titel;
- auteur/bron;
- jaar;
- URL;
- richtlijn;
- gekoppelde module;
- korte relevantie.

### Competenties

- competentienaam;
- framework/register;
- toelichting;
- gekoppelde module/leerdoel.

## Stap 8 — Evaluatieformulier

Admin krijgt knop:

`Standaard Kwaliteitshuis-evaluatie toepassen`

Standaardvragen:

- niveau/diepgang;
- relevantie voor de praktijk;
- toepasbaarheid;
- kwaliteit van de leerstof;
- toets passend bij de leerstof;
- geschatte versus werkelijke studielast;
- verbeterpunten.

## Stap 9 — Live accreditatiecheck

De cockpit toont live:

- concept;
- aantal blokkades;
- aantal waarschuwingen;
- klaar voor reviewer-preview;
- klaar voor indienpakket;
- klaar voor publicatie.

Blokkades:

- geen reviewer gekoppeld;
- minder dan 3 leerdoelen;
- geen literatuur;
- vraagenaantal te laag;
- toetsvraag zonder leerdoel;
- geen evaluatieformulier;
- geen aanbieder/ondertekenaar;
- geen versiedatum;
- moduleduur ontbreekt;
- video niet afgedekt door toets/opdracht.

## Stap 10 — Reviewer-preview

Admin krijgt één duidelijke route/actie:

`Bekijk als reviewer`

Reviewer ziet:

- alle modules;
- alle lessen;
- video’s;
- toetsvragen;
- juiste antwoorden;
- feedback;
- leerdoelen;
- literatuur;
- competenties;
- evaluatieformulier;
- dossier;
- zonder voortgang te muteren.

## Stap 11 — Eén klik indienpakket

Admin kan genereren/downloaden:

- Markdown dossier vandaag;
- CSV/PE-online exports vandaag;
- later PDF/HTML.

Dossier bevat:

- programma per module;
- studielast;
- leerdoelen;
- inhoud per module;
- werkvormen;
- toetsplan;
- vraag-leerdoel-matrix;
- literatuur/richtlijnen;
- competenties;
- evaluatieformulier;
- reviewer-instructie;
- versie/logboek;
- certificaatvoorbeeld.

## Stap 12 — Media-upload

Minimaal einddoel:

- uploadveld voor video;
- uploadveld voor documenten/PDF;
- bestandsnaam netjes opslaan;
- bestand koppelen aan les;
- video direct previewbaar;
- duur kunnen invullen;
- waarschuwing bij groot bestand;
- geen ruwe `/lms/...mp4` paden zichtbaar voor deelnemers.

Advies opslag:

- korte termijn: link/assetreferentie met preview;
- schaalbaar: Vercel Blob, Cloudflare R2, S3 of Vimeo/Stream.

---

## Implementatietaken vandaag

### Task 1: Harde indienvelden opslaan

**Objective:** Zorg dat aanbieder, ondertekenaar en activiteit-ID niet alleen in het schema bestaan, maar via de adminform opgeslagen worden.

**Files:**
- Modify: `src/app/lms-actions.ts`
- Modify: `src/components/lms/accreditation-panel.tsx`

**Steps:**
1. Voeg formvelden toe: `providerName`, `providerSignatureName`, `accreditationActivityId`, `status`, `isMandatory`.
2. Parse en valideer status als `CONCEPT | REVIEW | PUBLISHED | ARCHIVED`.
3. Sla velden op in `saveCourseAccreditationMetadataAction`.
4. Geef deze velden door aan `buildAccreditationChecklist` in panel en publish action.
5. Run typecheck/lint.

### Task 2: Admin-builder cockpit maken

**Objective:** Maak bovenin een duidelijke guided cockpit met stappen, blokkades en dossierstatus.

**Files:**
- Modify: `src/components/lms/accreditation-panel.tsx`

**Steps:**
1. Voeg builderstappen-array toe.
2. Toon per stap status: compleet, mist info, waarschuwing.
3. Toon compacte statuschips: basis, accreditatie, structuur, toetsing, evaluatie, reviewer, dossier.
4. Toon open kritieke blokkades als aparte lijst.

### Task 3: Basis/accreditatieformulier herstructureren

**Objective:** Vervang de generieke “Algemene gegevens beheren” UX door Stap 1 en Stap 2.

**Files:**
- Modify: `src/components/lms/accreditation-panel.tsx`

**Steps:**
1. Splits visueel in `Stap 1 — Basis` en `Stap 2 — Accreditatiegegevens`.
2. Voeg labels en helperteksten toe.
3. Maak doelgroep/doelgroepprofiel expliciet.
4. Maak verplicht/aanbevolen zichtbaar als Need to know/Nice to know.

### Task 4: Leerdoel-toets-matrix verbeteren

**Objective:** Toon leerdoelen met module- en toetsdekking zodat admin direct ziet wat ontbreekt.

**Files:**
- Modify: `src/components/lms/accreditation-panel.tsx`

**Steps:**
1. Bouw helper voor objective coverage.
2. Toon `x van 3–6 leerdoelen`.
3. Toon per leerdoel: module, gekoppelde toetsen, status.
4. Toon leerdoelen zonder toetsdekking als waarschuwing.

### Task 5: Modulekaarten en les/contentblok-readiness verbeteren

**Objective:** Maak modulebeheer visueler, ook als CRUD nog via compacte tekstinvoer gaat.

**Files:**
- Modify: `src/components/lms/accreditation-panel.tsx`

**Steps:**
1. Toon modulekaarten met intro, samenvatting, werkvormen, lessen, literatuur, competenties.
2. Toon per module of er lessen/contentblokken zijn.
3. Voeg disabled/coming-next CTA’s toe voor toevoegen/dupliceren/verplaatsen/bekijk als deelnemer.

### Task 6: Dossier/export duidelijk als indienpakket presenteren

**Objective:** Maak de exportsectie productiever en minder technisch.

**Files:**
- Modify: `src/components/lms/accreditation-panel.tsx`

**Steps:**
1. Herlabel naar `Genereer accreditatiedossier`.
2. Toon wat er in het dossier zit.
3. Toon PE-online CSV als apart onderdeel van het indienpakket.
4. Voeg reviewer-instructie copy toe.

### Task 7: Validatie

**Objective:** Bewijs dat wijzigingen compileerbaar zijn.

**Commands:**
- `npm run lint`
- `npm run build`
- indien nodig: `npx prisma validate`

---

## Acceptatiecriteria voor vandaag

- Admin ziet een duidelijke builder-cockpit in plaats van alleen technische textareas.
- Harde indienvelden zijn zichtbaar én worden opgeslagen.
- Accreditatiechecklist gebruikt de opgeslagen aanbieder/ondertekenaar/activiteit-ID.
- De publicatiegate kan niet groen worden zonder deze velden.
- Leerdoelen en toetsdekking zijn visueel controleerbaar.
- Modulekaarten tonen lessen, werkvormen, literatuur en competenties.
- Het dossier voelt als één indienpakket, niet als losse export.
- Build/lint zijn uitgevoerd of blokkades zijn concreet gerapporteerd.

---

## Vervolg na vandaag

### Sprint 2 — Echte CRUD-builder

- course aanmaken vanaf `/academybeheer/e-learning/nieuw`;
- module toevoegen/bewerken/verplaatsen/dupliceren;
- les/contentblok toevoegen;
- toetsbank CRUD;
- literatuur/competenties als losse kaarten/formulieren;
- reviewer-account koppelen vanuit UI.

### Sprint 3 — Media-upload

- opslagkeuze maken: Vercel Blob/R2/S3/Vimeo;
- upload route/action;
- video preview;
- document upload;
- media koppelen aan les;
- ruwe paden verbergen in learner UI.

### Sprint 4 — Bulkimport

- import uit Word/Markdown/CSV;
- mapping preview vóór opslaan;
- importlog;
- rollback/dupliceren als nieuwe versie.

### Sprint 5 — E2E hardening

- admin bouwt e-learning vanaf nul;
- reviewer preview muteert geen voortgang;
- fysiotherapeut/praktijkondersteuner/fitcoach zichtbaarheid;
- learner afronding/certificaat;
- PE-online export.
