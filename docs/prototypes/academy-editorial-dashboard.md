# Fy-fit Academy — rustig dashboardprototype

## Status

Review-safe visueel prototype op branch `design/academy-editorial-prototype`.

- Geen databasekoppeling
- Geen authenticatie of productieaccount nodig
- Geen wijziging aan bestaande Academy-routes
- Geen wijziging aan PFP-accreditatieomgeving
- Niet naar `main` of Vercel productie gepusht

## Route

Lokaal: `/concept/academy`

De route is statisch gegenereerd en gebruikt uitsluitend voorbeeldinhoud.

## Designrichting

Primair een rustig intern productdashboard. De gebruiker ziet direct:

1. waar die gebleven is;
2. welke e-learnings beschikbaar zijn;
3. wat er gepland staat;
4. welke onderdelen zijn afgerond.

De zijbalk blijft het belangrijkste navigatieanker. Marketingachtige koppen, verkooppraat, grote promotieblokken en onnodige statistieken zijn verwijderd.

## Fy-fit merkbron

Het volledige Fy-fit-logo en de kleurvariabelen zijn rechtstreeks overgenomen uit de aangeleverde website-inspiratie:

- Orange: `#cd662d`
- Orange action: `#a94e22`
- Orange on dark: `#f3a06f`
- Orange soft: `#f4ddcf`
- Canvas/paper: `#fbf8f3`
- Cream: `#f4eee7`
- Dark/forest: `#1f2b26`
- Ink: `#1c1c1a`
- Muted: `#62625d`
- Line: `rgba(28, 28, 26, 0.11)`

## Belangrijkste keuzes

- Donkere Fy-fit-zijbalk met het echte logo
- Compacte productheader
- Zakelijke interne tekst: `Mijn Academy`, `Goedemorgen, Luuk`, `Onboarding Fy-fit`
- Eén rustige `Ga verder`-kaart
- E-learnings als compacte lijst in plaats van een drukke kaartencatalogus
- Planning en afgeronde onderdelen als secundaire informatie
- Mobiel menu zonder extra vaste ondernavigatie
- Solide kleuren en dunne randen; geen algemene gradients of glassmorphism

## Interacties

- Filters `Alles`, `Bezig` en `Afgerond`
- Klikbare acties met prototypefeedback
- Responsive mobiel menu
- Desktop- en mobiele lay-out zonder horizontale overflow

## Gecontroleerd

- `npm run lint`
- `npm run build`
- Statische route `/concept/academy` succesvol gebouwd
- Playwright op 1440px en 390px
- Filters, feedback-toast en mobiel menu werken
- Geen consolefouten of mislukte netwerkrequests
- Geen horizontale overflow
