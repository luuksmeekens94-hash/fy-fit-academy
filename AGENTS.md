# Fy-fit Academy — agent instructions

## Purpose and stack

Fy-fit Academy is an internal learning and development platform for Fy-fit employees. It uses Next.js 16 (App Router), React 19, TypeScript 5, Prisma 7 with PostgreSQL/Neon, Tailwind CSS 4, and Vercel.

<!-- BEGIN:nextjs-agent-rules -->
## Next.js 16

This version has breaking changes. Before using unfamiliar Next.js APIs, read the relevant local guide in `node_modules/next/dist/docs/` and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Architecture

- Put database reads in `src/lib/data.ts`; wrap queries with React `cache()` and map Prisma output to app types.
- Put mutations in `src/app/actions.ts` as Server Actions.
- Use types from `src/lib/types.ts` in UI code; do not expose Prisma types directly to UI components.
- Keep authentication checks in the existing `requireUser()` and `requireRole()` flow.
- Use the existing CSS variables and design tokens. Do not hardcode a new colour system or add a component library without an approved spec.
- Keep user-facing text and code comments in Dutch unless an external API requires otherwise.

## Luuk Dev Loop

For product work, follow this sequence:

1. Spec: inspect the repository, ask only material product questions, and record goal, context, acceptance criteria, risks, and explicit non-goals in a GitHub Issue.
2. Approval: do not build until Luuk explicitly approves the spec and the issue is marked `agent-ready`.
3. Build: create a branch named `agent/<short-description>`, implement only the approved scope, and record validation evidence.
4. Review: compare the pull request independently against the issue, inspect the full diff, and check CI results.
5. Human merge: Luuk reviews the Vercel preview and is the only person who decides whether to merge and publish.

Never commit directly to `main`, merge a pull request, or intentionally start a production deployment.

## Required validation

Use the safest relevant checks for the change:

`npm ci`
`npm run lint`
`npx tsc --noEmit`
`npm run build`

Run `npm run test:e2e` when user behaviour changes and suitable non-production test data is available. Do not weaken, skip, or remove tests merely to make CI pass. If a check cannot run safely because required non-production infrastructure is unavailable, document that clearly in the pull request.

## Database and data safety

- Never run `npm run db:seed` or execute `prisma/seed.ts` without separate, explicit approval from Luuk. The seed may delete existing data.
- Never run `npm run db:push` against production or an unknown database.
- Never use production secrets, production data, real employee records, or real user credentials for development or tests.
- Never modify Vercel environment variables or authentication settings unless the approved spec explicitly requires it and Luuk separately approves the production-impacting action.
- Database schema changes require an explicit acceptance criterion, a migration/rollback plan, and human review.

## Scope and change discipline

- Read the linked issue and this file before editing.
- Preserve unrelated user changes and avoid opportunistic refactors.
- Do not edit demo accounts, authentication settings, database schema, seed scripts, or deployment configuration unless the approved issue explicitly includes them.
- Do not add dependencies unless they are necessary for the approved scope and justified in the pull request.
- Never commit secrets or local environment files.

## Pull request handoff

Every pull request must link its issue and state:

- what changed and why;
- which acceptance criteria are satisfied;
- commands run and their outcomes;
- security, database, authentication, and deployment impact;
- manual checks still required;
- any known limitations or follow-up work.

A green automated review means `loop-approved`, not permission to merge. Apply `needs-human-review` until Luuk has reviewed the result.
