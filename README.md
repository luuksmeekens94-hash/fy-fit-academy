# Fy-Fit Academy

Intern leer- en ontwikkelplatform voor **Fy Fit Fysiotherapie Nijmegen**.

De applicatie ondersteunt nu al de bestaande Academy-domeinen:
- dashboard
- academy-modules
- bibliotheek
- onboarding
- ontwikkeling / POP
- teamoverzicht
- mijn-gegevens
- admin

Daarnaast is de **nieuwe LMS-domeinlaag** technisch al gestart in de codebase, zodat het platform gefaseerd kan doorgroeien naar een volwaardig LMS met cursussen, lessen, toetsing, voortgang en certificaten.

## Live omgevingen

- **GitHub repo:** https://github.com/luuksmeekens94-hash/fy-fit-academy
- **Productie:** https://fy-fit-academy.vercel.app
- **Vercel project:** https://vercel.com/luuksmeekens94-6788s-projects/fy-fit-academy

## Stack

- **Next.js 16.2.1** (App Router)
- **React 19**
- **TypeScript 5**
- **Prisma 7.5** met `@prisma/adapter-pg`
- **PostgreSQL via Neon**
- **Tailwind CSS 4**
- **Deployment via Vercel**

## Authenticatie en rollen

De app gebruikt **cookie-based HMAC auth** met een ondertekende sessiecookie.

Rollen:
- **BEHEERDER**
- **TEAMLEIDER**
- **MEDEWERKER**

Belangrijke auth-bestanden:
- `src/lib/auth.ts`
- `src/lib/session.ts`

## Projectstructuur

### App-routes

`src/app/(protected)/`
- `page.tsx` — dashboard
- `academy/` — bestaande Academy-modules
- `bibliotheek/` — documenten en protocollen
- `onboarding/` — onboardingpad en voortgang
- `ontwikkeling/` — leerdoelen en ontwikkeldocumenten
- `team/` — teamoverzicht en medewerkerdetail
- `mijn-gegevens/` — profiel
- `admin/` — beheerfunctionaliteit

Publieke route:
- `src/app/login/page.tsx`

### Shared logic

- `src/app/actions.ts` — bestaande server actions
- `src/lib/data.ts` — bestaande querylaag en mappers
- `src/lib/types.ts` — app-types
- `src/lib/prisma.ts` — Prisma client

### LMS-domeinlaag

De LMS-laag staat bewust **naast** de bestaande Academy-modulelogica.

Belangrijkste bestanden:
- `prisma/schema.prisma` — bevat zowel bestaande Academy-modellen als LMS-modellen
- `src/lib/lms/types.ts`
- `src/lib/lms/queries.ts`
- `src/lib/lms/scoring.ts`
- `src/lib/lms/rules.ts`
- `src/lib/lms/certificates.ts`

### Huidige LMS-status

**Al aanwezig:**
- datamodel voor `Course`, `CourseVersion`, `Lesson`, `Enrollment`, `Assessment`, `Certificate`, etc.
- query- en helperlaag in `src/lib/lms/`

**Nog te bouwen:**
- LMS-routes in `src/app/(protected)/lms/`
- LMS server actions
- end-to-end medewerkerflow
- admin/teamleider LMS-schermen
- seeddata voor een volledige LMS-demo-flow

## Database en environment variables

Benodigde variabelen:

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SESSION_SECRET=...
```

Deze staan lokaal in `.env.local` en in Vercel als project environment variables.

## Lokale ontwikkeling

### Installeren

```bash
npm install
```

### Development server starten

```bash
npm run dev
```

Open daarna:
- http://localhost:3000

### Prisma client genereren

```bash
npm run db:generate
```

### Schema pushen naar database

```bash
npm run db:push
```

### Seed draaien

```bash
npm run db:seed
```

## Beschikbare scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:push
npm run db:seed
```

## Demo-accounts

Wachtwoord voor de demo-accounts:

```txt
fyfit-demo
```

Bekende accounts in de seed:
- `marion@fysiotherapienijmegen.nl` — BEHEERDER
- `sjoerd@fysiotherapienijmegen.nl` — TEAMLEIDER
- `luuk@fysiotherapienijmegen.nl` — MEDEWERKER

Controleer altijd `prisma/seed.ts` voor de actuele seedinhoud.

## Belangrijke projectregels

1. Lees `CLAUDE.md` eerst voordat je grotere wijzigingen doet.
2. Next.js 16 heeft breaking changes; check relevante docs als je nieuwe framework-API’s gebruikt.
3. Houd LMS-logica uit de bestaande `src/lib/data.ts` en `src/app/actions.ts` waar mogelijk.
4. Bouw het LMS als **nieuw domein**, niet als uitbreiding van `Module`.
5. Gebruik bestaande design tokens en componentstijl; introduceer geen los nieuw design system.

## Huidige ontwikkelrichting

De gekozen route voor de volgende fase is:
- bestaande Academy intact houden
- LMS verder uitbouwen als parallel domein
- eerst één volledige flow bouwen:
  - cursus
  - les
  - toets
  - afronding
  - certificaat
- daarna pas verbreden naar uitgebreid beheer, reviewworkflow en rapportage

Het actieve implementatieplan staat in:
- `docs/plans/2026-04-16-fy-fit-academy-lms-plan.md`
