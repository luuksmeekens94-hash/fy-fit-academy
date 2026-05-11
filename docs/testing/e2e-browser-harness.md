# Browser E2E-harnas

Fy-Fit Academy gebruikt Playwright voor echte browserbesturing: openen, klikken, formulieren invullen, redirects controleren en traces/screenshots bewaren bij fouten.

## Basis draaien

```bash
npm run test:e2e
```

Standaard draait dit tegen `http://localhost:3000`. Playwright start `npm run dev` zelf, of hergebruikt een bestaande lokale server.

Tegen productie:

```bash
E2E_BASE_URL=https://fy-fit-academy.vercel.app npm run test:e2e
```

Met zichtbare browser:

```bash
npm run test:e2e:headed
```

## Testaccounts per rol

Secrets worden nooit gecommit. Zet ze lokaal, in de shell of in CI-secret variables:

```bash
export E2E_MEDEWERKER_EMAIL="..."
export E2E_MEDEWERKER_PASSWORD="..."
export E2E_TEAMLEIDER_EMAIL="..."
export E2E_TEAMLEIDER_PASSWORD="..."
export E2E_PRAKTIJKMANAGER_EMAIL="..."
export E2E_PRAKTIJKMANAGER_PASSWORD="..."
export E2E_PRAKTIJKHOUDER_EMAIL="..."
export E2E_PRAKTIJKHOUDER_PASSWORD="..."
export E2E_BEHEERDER_EMAIL="..."
export E2E_BEHEERDER_PASSWORD="..."
export E2E_REVIEWER_EMAIL="..."
export E2E_REVIEWER_PASSWORD="..."
```

Als een rol geen beide waarden heeft, wordt die roltest niet aangemaakt.

## Muterende flows

Tests die echte data aanmaken of publiceren zijn standaard uitgeschakeld. Zet expliciet:

```bash
E2E_RUN_MUTATING=1 npm run test:e2e
```

Gebruik dit alleen met testaccounts/testdata. De praktijkmededelingen-flow publiceert echt en maakt notificaties aan.

## Huidige dekking

- Anonieme protected-route smoke:
  - `/praktijkbeheer` moet naar `/login`.
  - `/academybeheer` moet naar `/login`.
- Loginpagina is klikbaar/invulbaar.
- Ingelogde rolmatrix zodra credentials aanwezig zijn:
  - medewerker;
  - teamleider;
  - praktijkmanager;
  - praktijkhouder;
  - beheerder;
  - reviewer.
- Notificatiefeed zichtbaar in protected shell.
- Muterende praktijkmededeling-publicatieflow achter `E2E_RUN_MUTATING=1`.

## Artefacten

Bij failures bewaart Playwright traces, screenshots en video in genegeerde folders:

- `test-results/`
- `playwright-report/`
- `.auth/`
