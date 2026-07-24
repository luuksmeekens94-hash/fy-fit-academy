# Fy-fit Academy — volledige route-integratie

## Status

De goedgekeurde dashboardrichting is geïntegreerd op de echte beschermde route `/academy`.

- De aparte route `/concept/academy` is verwijderd.
- De pagina gebruikt echte cursus-, voortgangs-, deadline- en zichtbaarheidsdata.
- Bestaande cursus-, les- en certificaatroutes blijven op dezelfde URL’s beschikbaar.
- Authenticatie en autorisatie blijven server-side actief.
- De reviewerflow onder `/lms` gebruikt bewust de bestaande shell en is niet gewijzigd.
- Er zijn geen databasewijzigingen, seeds, imports of migraties nodig voor deze UI-uitrol.

## Architectuur

De Academy-routes staan in de routegroep `src/app/(academy)/academy` en gebruiken een eigen route-specifieke layout:

- `src/app/(academy)/layout.tsx`
- `src/components/academy/academy-app-shell.tsx`
- `src/components/academy/academy-shell.module.css`

Hierdoor krijgt de volledige persoonlijke Academy-flow de nieuwe zijbalk, topbar en mobiele ondernavigatie zonder de revieweromgeving onder `/lms` te wijzigen.

De dashboardpagina behoudt de bestaande functionele bronnen:

- `requireUser()` voor de actieve sessie;
- `canUsePersonalLms()` voor roltoegang;
- `getMyAcademyCourses()` voor echte cursussen, voortgang en contentzichtbaarheid;
- `buildAcademyOverview()` voor doelgroepgerichte copy en groepering;
- `buildAcademyDashboardModel()` voor de primaire vervolgactie zonder dubbele cursusweergave.

## Ondersteunde rollen en doelgroepen

De route is gecontroleerd voor de persoonlijke Academy-rollen:

- medewerker;
- teamleider;
- praktijkhouder.

De doelgroepgerichte inhoud is gecontroleerd voor:

- fysiotherapeut;
- praktijkondersteuner;
- fitcoach.

De technische labels `Need to know` en `Nice to know` worden in de interface vertaald naar `Verplicht` en `Verdieping`.

## Designrichting

- Donkere Fy-fit-zijbalk met het echte logo links uitgelijnd op een compact licht merkvlak.
- Warm off-white canvas met Fy-fit-oranje en diepgroen.
- Eén rustige primaire cursuskaart met echte voortgang en echte CTA.
- E-learnings als compacte, scanbare lijst met echte status en studielast.
- Zoekfunctie op de echte cursuscollectie.
- Certificaten en persoonlijke totalen als secundaire informatie.
- Lucide als consistente professionele lijniconset.
- Subtiele merkgradients alleen op primaire acties, actieve navigatie, voortgang en beperkte merkvlakken.
- Geen verkoopcopy, gamification, fictieve planning of voorbeeldstatistieken.

## Mobiel

- Compacte topbar met Fy-fit-logo, Academy-label en profiel.
- Vaste ondernavigatie met `Overzicht`, `Bewijzen`, rolafhankelijk `Ontwikkeling` of `Bibliotheek`, en `Meer`.
- `Meer` opent de volledige navigatielade.
- Content heeft veilige onderruimte en wordt niet door de navigatie bedekt.
- Geen horizontale overflow op 390px.

## Reviewerbescherming

De reviewer gebruikt de bestaande route `/lms` en valt niet onder de persoonlijke Academy-layout. Gecontroleerd:

- reviewer kan inloggen;
- `/lms` blijft bereikbaar;
- de PFP-e-learning blijft zichtbaar;
- de bestaande reviewershell blijft actief;
- geen reviewerprogressie of accreditatiedata is gewijzigd.

## Verificatie

- test-first dashboardmodel met selectie, deduplicatie, zoekgedrag, immutability en labelvertaling;
- volledige ESLint-run;
- 156 unit tests geslaagd;
- Next.js productiebuild en TypeScript geslaagd;
- echte desktoproute getest op 1440px;
- echte mobiele route getest op 390px;
- cursusdetailroute gecontroleerd binnen de nieuwe Academy-shell;
- medewerker, teamleider en praktijkhouder gecontroleerd;
- fysiotherapeut, praktijkondersteuner en fitcoach gecontroleerd;
- reviewerlogin, `/lms` en PFP-weergave gecontroleerd;
- geen consolefouten of niet-afgebroken netwerkfouten;
- `/concept/academy` geeft 404.
