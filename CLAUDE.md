# CLAUDE.md — Fy-fit Academy

## Wat is dit?

Intern e-learning en ontwikkelplatform voor fysiotherapiepraktijk Fy-fit. Medewerkers volgen modules, doorlopen onboarding, beheren leerdoelen en raadplegen protocollen/werkafspraken.

## Stack

- **Next.js 16.2.1** (App Router, React 19, Server Components + Server Actions)
- **Prisma 7.5** met `@prisma/adapter-pg` (PrismaPg driver adapter)
- **PostgreSQL** via Neon (serverless)
- **Tailwind CSS 4** (PostCSS plugin, niet de CLI)
- **TypeScript 5**
- **Deployment:** Vercel

> ⚠️ Next.js 16 heeft breaking changes t.o.v. eerdere versies. Lees `node_modules/next/dist/docs/` voordat je nieuwe Next.js API's gebruikt.

## Projectstructuur

```
prisma/
  schema.prisma          # Datamodel (enums, 11 modellen)
  seed.ts                # Database seeder met demo-data
src/
  app/
    layout.tsx           # Root layout (fonts, metadata)
    globals.css          # Design tokens + Tailwind
    actions.ts           # ALLE server actions (auth, CRUD, admin)
    login/page.tsx       # Login pagina
    (protected)/         # Route group: vereist auth
      layout.tsx         # AppShell wrapper
      page.tsx           # Dashboard (rolafhankelijk)
      academy/           # Modules overzicht + detail
      bibliotheek/       # Documenten/protocollen
      onboarding/        # Inwerkpad voor nieuwe medewerkers
      ontwikkeling/      # POP, leerdoelen, ontwikkeldocumenten
      team/              # Teamoverzicht (teamleider/beheerder)
      mijn-gegevens/     # Profiel + wachtwoord wijzigen
      admin/             # Beheerderspaneel
  components/            # Gedeelde UI componenten
  lib/
    auth.ts              # Session helpers (requireUser, requireRole)
    data.ts              # ALLE database queries (Prisma, cached)
    password.ts          # scrypt hashing (Node crypto)
    prisma.ts            # Prisma client singleton
    session.ts           # HMAC-signed cookie sessions
    types.ts             # TypeScript types (geen Prisma types in UI)
    utils.ts             # Formatters, helpers
  proxy.ts               # Dev proxy config
```

## Architectuurprincipes

### Data flow
- **Queries** → `src/lib/data.ts` (React `cache()` wrapped, `"server-only"`)
- **Mutaties** → `src/app/actions.ts` (Server Actions met `"use server"`)
- UI componenten gebruiken types uit `src/lib/types.ts`, NIET direct Prisma types
- Mapping functies in `data.ts` converteren Prisma output → app types

### Auth
- Cookie-based sessions met HMAC-SHA256 signing
- Cookie naam: `fyfit-session`, 14 dagen geldig
- `SESSION_SECRET` env var (fallback: development secret)
- Geen JWT, geen externe auth provider
- `requireUser()` → redirect naar `/login` als niet ingelogd
- `requireRole([...])` → redirect naar `/` als rol niet matcht

### Rollen (3 niveaus)
- **MEDEWERKER** — Eigen modules, leerdoelen, ontwikkeldocumenten, onboarding
- **TEAMLEIDER** — Ziet teamleden (via `teamleaderId` relatie), hun voortgang en doelen
- **BEHEERDER** — Volledige CRUD op alles: users, modules, documenten, categorieën, onboardingpaden

### Styling
- Custom design tokens in CSS variables (warm/earthy palette)
- Tailwind utility classes met `var(--token)` referenties
- Rounded cards (`rounded-[32px]`, `rounded-[24px]`), zachte schaduwen
- Geen component library (alles custom)
- Responsive: mobile-first met `md:` en `lg:` breakpoints

## Database

### Modellen (Prisma schema)
- `User` — met buddy/teamleider self-relations
- `Category` — gedeeld door modules én documenten
- `Module` → `ModuleSection` (TEXT/VIDEO/QUIZ/IMAGE met quizData JSON)
- `ModuleProgress` — per user per module (unique constraint)
- `OnboardingPath` → `OnboardingStep` → `OnboardingProgress`
- `Document` — bibliotheek items (PROTOCOL/WERKAFSPRAAK/KERNBOODSCHAP/FORMAT/OVERIG)
- `LearningGoal` — persoonlijke ontwikkeldoelen
- `DevelopmentDocument` — POP documenten met PRIVATE/TEAM visibility

### Enums
Alle enums zijn Nederlandstalig: `MEDEWERKER`, `TEAMLEIDER`, `BEHEERDER`, `GEPUBLICEERD`, `AFGEROND`, etc.

### Prisma client
Gebruikt `@prisma/adapter-pg` (PrismaPg) met connection string uit `DIRECT_URL` of `DATABASE_URL`.

## Environment variables

```env
DATABASE_URL=postgresql://...        # Neon pooled connection
DIRECT_URL=postgresql://...          # Neon unpooled (voor Prisma)
SESSION_SECRET=...                   # HMAC signing key
```

## Commando's

```bash
npm run dev              # Start dev server
npm run build            # Prisma generate + Next.js build
npm run db:generate      # prisma generate
npm run db:push          # prisma db push (schema sync)
npm run db:seed          # tsx prisma/seed.ts (reset + seed)
```

## Demo-accounts

Wachtwoord voor alle accounts: `fyfit-demo`

| Email | Rol | Naam |
|-------|-----|------|
| marion@fysiotherapienijmegen.nl | BEHEERDER | Marion Brouwer |
| sjoerd@fysiotherapienijmegen.nl | TEAMLEIDER | Sjoerd Hendriks |
| luuk@fysiotherapienijmegen.nl | MEDEWERKER | Luuk Peters |
| dave@fy-fitacademy.demo | TEAMLEIDER | Dave Willems |
| heidi@fy-fitacademy.demo | BEHEERDER | Heidi Jansen |
| ryan@fy-fitacademy.demo | MEDEWERKER (onboarding) | Ryan de Vries |
| fleur@fy-fitacademy.demo | MEDEWERKER | Fleur van Dijk |

> **Let op:** de seed bevat mogelijk beide sets accounts. Check `prisma/seed.ts` voor de actuele staat.

## Conventies

- **Taal:** UI en code comments in het Nederlands
- **Server Actions:** Alle mutaties in `src/app/actions.ts`, niet verspreid over routes
- **Data queries:** Alle reads in `src/lib/data.ts`, altijd via mapping functies
- **Geen client-side state management** — alles via Server Components + Server Actions + `revalidatePath()`
- **Validatie:** `assert()` helper in actions, geen aparte validation library
- **Formulieren:** Native `<form>` met `formAction`, geen controlled inputs tenzij nodig

## Bekende beperkingen / TODO

- Geen file uploads (afbeeldingen, documenten) — content is tekst-only
- Geen notificaties/e-mail
- Geen zoekfunctionaliteit
- Quiz scoring is simpel (toggle AFGEROND/BEZIG, geen echte scoreberekening per sectie)
- Geen audit trail / logging
- Session heeft geen refresh mechanism (14 dagen hard expiry)
- `revalidateCorePages()` invalideert alle pagina's bij elke mutatie (grof maar functioneel)

## Deployment

- **Vercel:** Auto-deploy vanuit GitHub main branch
- **Live URL:** https://fy-fit-academy.vercel.app
- **GitHub:** luuksmeekens94-hash/fy-fit-academy
- **Database:** Neon PostgreSQL (aparte DB, niet gedeeld met andere projecten)
- Vercel env vars: `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET` — handmatig ingesteld

## Werkwijze voor agents

1. **Lees dit bestand eerst** voordat je code schrijft
2. **Feature branches** — werk NIET direct op main
3. **Test lokaal** met `npm run dev` voordat je pushed
4. **Prisma changes** → update `schema.prisma`, run `db:push`, update `seed.ts`, update `types.ts` en mapping functies in `data.ts`
5. **Nieuwe queries** → toevoegen in `data.ts` met `cache()` wrapper
6. **Nieuwe mutaties** → toevoegen in `actions.ts` als Server Action
7. **Styling** → gebruik bestaande CSS tokens, geen nieuwe kleuren hardcoden
