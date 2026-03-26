# Fy-fit Academy

MVP-demo voor een interne Fy-fit academy met vijf kernstromen:

- dashboard per rol
- academy-modules
- bibliotheek
- onboarding
- persoonlijke ontwikkeling / POP

## Lokale start

```bash
npm install
npm run dev
```

Open daarna [http://localhost:3000](http://localhost:3000).

## Van lokaal naar gedeelde demo

### 1. Neon database aanmaken

- Maak een nieuw project aan in Neon
- Kopieer de connection string
- Zet die lokaal in `.env.local` als `DATABASE_URL`
- Zet diezelfde variabele later in Vercel

Gebruik lokaal bijvoorbeeld:

```env
DATABASE_URL="postgresql://user:password@host:5432/fyfitacademy?schema=public"
```

### 2. Prisma initialiseren tegen Neon

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

Hiermee genereer je de Prisma client, maak je het schema aan en vul je de database met demo-inhoud.

### 3. Deployen naar Vercel

- Push de repo naar GitHub
- Importeer het project in Vercel
- Voeg `DATABASE_URL` toe bij de environment variables
- Deploy opnieuw nadat de env var is opgeslagen

### 4. Aanbevolen volgorde

- Eerst lokaal valideren
- Dan Neon koppelen
- Dan seed draaien
- Dan pas Vercel deployen

Zo blijft de demo straks deelbaar, terwijl de stack al klaarstaat voor echte persistentie.

## Demo-accounts

Alle accounts gebruiken wachtwoord `fyfit-demo`.

- `heidi@fy-fitacademy.demo` - beheerder
- `dave@fy-fitacademy.demo` - teamleider
- `ryan@fy-fitacademy.demo` - medewerker in onboarding
- `fleur@fy-fitacademy.demo` - medewerker

## Architectuur

- `src/app/(protected)` bevat alle ingelogde routes
- `src/app/actions.ts` bevat server actions voor demo-auth en simpele mutaties
- `src/lib/demo-data.ts` bevat de in-memory seed/store voor de demo
- `src/lib/prisma.ts` bevat de Prisma client helper voor de databasefase
- `prisma/schema.prisma` legt het bedoelde PostgreSQL-datamodel vast voor de vervolgfase
- `prisma/seed.ts` vult een Neon/Postgres database met dezelfde basis als de demo

## Huidige status

De app draait nu op een demo-first basis met een in-memory store, zodat flows direct toonbaar zijn zonder eerst een database te provisionen. Het Prisma-schema is alvast aanwezig voor de stap naar Neon/PostgreSQL.

## Belangrijke noot

De UI leest nu nog uit de demo-store in `src/lib/demo-data.ts`. De database-setup is dus klaar voor de volgende fase, maar nog niet live aangesloten op de pagina's. De beste vervolgstap is daarom: schermen één voor één omzetten van demo-data naar Prisma-queries.
