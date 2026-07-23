# Fy-fit Editorial Academy — dashboardprototype

## Status

Review-safe visueel prototype op branch `design/academy-editorial-prototype`.

- Geen databasekoppeling
- Geen authenticatie of productieaccount nodig
- Geen wijziging aan de bestaande Academy-routes
- Geen wijziging aan de PFP-accreditatieomgeving
- Niet naar `main` of Vercel productie gepusht

## Route

Lokaal: `http://127.0.0.1:3101/concept/academy`

De route is statisch gegenereerd en gebruikt uitsluitend voorbeeldinhoud.

## Design stance

Primair een **Monitor**-oppervlak met **Explore** als tweede taak: de medewerker ziet direct waar die verder kan en kan daarna passend leeraanbod verkennen.

Belangrijkste keuzes:

- Compacte donkergroene productnavigatie in plaats van een decoratieve hero op elke pagina
- Warm off-white canvas, terracotta hoofdactie en diep groen als merkanker
- Fraunces voor redactionele koppen; Plus Jakarta Sans voor product-UI
- Eén dominante `Ga verder`-kaart
- Cursuskaarten met duur, modules, voortgang en één duidelijke actie
- Ontwikkelplanning, POP en certificaten als secundaire context
- Mobiele drawer plus compacte vaste ondernavigatie
- Geen gradients/glassmorphism als algemene kaartstijl

## Interacties in het prototype

- Cursusfilters `Voor jou`, `Alles` en `Afgerond`
- Klikbare primaire en secundaire acties met prototype-feedback
- Responsive mobiel menu
- Desktop- en mobiele lay-out zonder horizontale overflow

## Gecontroleerd

- `npm run lint`
- `npm run build`
- Statische route `/concept/academy` wordt succesvol gebouwd
- Playwright op 1440px en 390px
- Filters, feedback-toast en mobiel menu werken
- Geen consolefouten of mislukte netwerkrequests
- Geen horizontale overflow
