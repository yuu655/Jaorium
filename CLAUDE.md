# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

JaoRium (jaorium.com) is a Japanese online mentoring platform connecting exam-prep students (受験生) with mentors (先輩/alumni) for paid video consultations. Built with Next.js App Router, mostly plain JavaScript with an in-progress incremental TypeScript migration (see "TypeScript" below), Supabase (auth + Postgres), Stripe (payments/payouts), LiveKit (video calls), Cloudflare R2 (file storage), Resend (email), and microCMS (blog articles).

## Commands

```bash
npm run dev        # start dev server (localhost:3000)
npm run build      # production build
npm run start      # run production build
npm test           # run the Vitest suite once
npm run test:watch # Vitest in watch mode
npm run typecheck  # tsc --noEmit (must stay at zero errors)
```

Run a single test file with `npx vitest run path/to/file.test.js`.

Tests use **Vitest** (`vitest.config.mjs`), colocated as `*.test.js` next to the code under test. There is no React component/UI testing set up yet (no jsdom/Testing Library) — existing tests cover pure utils, API route handlers, and server actions, all via mocked Supabase/Stripe/Resend clients (see `src/test/supabaseMock.js` for the shared Supabase mock builder).

The old password-based signup remnants (`signup/user/actions.js`'s `signupMentor()` and `signup/mentor/actions.js`'s `signupUser()`) — unused leftovers from before the OTP-based flow, one of which had a `signup_mentor()` bug stamping `user_metadata.role` as `"user"` on mentor signups — have been removed along with their tests. Current signup only uses the OTP-based `signupUser`/`signupMentor` exports in each page's `actions.js`. (Three related bugs — an `app_metadata.role`-based admin check in `api/mentor/route.js`, a no-op password-confirmation check in `signup/mentor/actions.js`, and unsanitized path segments in `api/r2_upload/route.js` — were already found and fixed, each with a regression test.)

There is no lint script configured in `package.json`, and no ESLint config exists in the repo — don't assume `npm run lint` exists.

Path alias: `@/*` → `./src/*` (see `tsconfig.json`).

## TypeScript (incremental migration in progress)

The repo is mid-migration from plain JS to TS. `tsconfig.json` (there is no `jsconfig.json` any more) sets `allowJs: true`, `checkJs: false`, `strict: true`, so `.js` and `.ts` coexist and **existing `.js` files are not type-checked** — only `.ts`/`.tsx` are. `next build` runs the type check, and `npm run typecheck` runs it standalone; both must stay at zero errors.

`src/lib/supabase/database.types.ts` is **generated** from the live schema — never hand-edit it. Regenerate after every migration:

```bash
npx supabase gen types typescript --project-id rmjjlkxqtrpuhemmjlun > src/lib/supabase/database.types.ts
```

All four Supabase client factories are now `.ts` and generic over `Database` (`client.ts`, `server.ts`, `admin.ts`, `proxy.ts`), so every `.from(...)`/`.rpc(...)` through them is checked against the real schema. What the generic does and does not catch, verified empirically:

- **caught**: unknown table name, unknown property on a returned row, unknown/missing column in `.insert()`/`.update()`, invalid enum value, unknown `.rpc()` name, and `data` being possibly `null`
- **not caught**: column names inside `.select("...")` strings and inside `.eq()`/filter arguments

Note that `typescript` must stay pinned to `^5`: `typescript@7` is the Go-native compiler and does not expose the classic compiler API that Next.js's type-check integration requires (`next build` fails with "It looks like you're trying to use TypeScript but do not have the required package(s) installed").

### Migration plan

Boundary-first, never a big-bang rewrite. Current file counts (excluding tests): **222 `.js` + 7 `.jsx` + 5 `.ts`**.

| Step | Scope | Status |
|---|---|---|
| 0 | `tsconfig.json`, `typescript@^5` + `@types/*`, `npm run typecheck`, Vitest include `.test.{js,ts}` | **done** |
| 1 | `database.types.ts` generated; the 4 Supabase client factories → `.ts`, generic over `Database` | **done** |
| 2 | The **62 remaining `.js`/`.jsx` files that touch Supabase** → `.ts`/`.tsx` (47 under `src/app`, 13 under `src/components`, 2 elsewhere) | **not started** |
| 3 | The **115 Supabase-free presentational components** → `.tsx`, opportunistically when touched. Never a dedicated task | **not started** |
| 4 | Derive types from the existing zod schemas with `z.infer` (`src/lib/validation/`) instead of writing them twice | **not started** |

Step 2 order — these carry the real payoff, because `strictNullChecks` turns Supabase's `data: T[] | null` into compile errors. ~19 unguarded dereferences of a possibly-`null` `data` exist today, concentrated in:

1. `src/app/(userPage)/dashboard/mentor/mentorDashboardData.js` (7)
2. `src/app/(userPage)/dashboard/admin/page.js` (5)
3. `src/app/(userPage)/dashboard/user/page.js` (4)

then the API routes (`api/webhooks/*`, `api/mentor/*`, `api/meeting/*`), then the rest.

### Conversion recipe / gotchas (learned the hard way)

- **Read `process.env.*` inside the function, not at module top level.** Tests stub env with `vi.stubEnv` in `beforeEach`, which runs *after* module evaluation — hoisting the read to a module constant silently breaks `admin.test.js` / `server.test.js` / `proxy.test.js`.
- Use `process.env.X!` for env vars rather than adding a throw-on-missing guard, unless you intend a behavior change.
- **Leave `*.test.js` as `.js`.** `checkJs: false` means they are not type-checked, so their duck-typed mocks (e.g. `makeRequest()` in `proxy.test.js` returning a plain object where a `NextRequest` is expected) keep working with no casts.
- Export a client type alias next to the factory (`ReturnType<typeof createServerClient<Database>>`) so downstream files can annotate a `supabase` parameter without re-deriving it.
- Prefer `import type { … }` for type-only imports. Note `dependency-cruiser` ignores those unless run with `--ts-pre-compilation-deps` (see `docs/architecture.md`).
- After each file, `npm run typecheck` **and** `npm test` — the type check alone will not catch a renamed export that only a `.js` test imports.

## Architecture

### Route groups (`src/app`)

- **`(main)`** — public marketing site: landing (`page.js`), `concept`, `mentors`, `articles`, `contact`, `recruitment`, `forCompanies`, `login`, `signup`. Its `layout.js` renders `Header`/`Footer` only (no `<html>`/`<body>` — those live in the root `src/app/layout.js`).
- **`(userPage)`** — authenticated area: `dashboard/{account,admin,mentor,user,delete,putComent,review,success}`, `setAccount/{user,mentor}`, `resetPass`, `error`. Same "no html/body" pattern; uses `components/dashboard/header.js`.
- **`(admin)`** — has a `layout.js` (with its own `<html>`/`<body>`) but no pages currently live under it; the actual admin dashboard is served from `(userPage)/dashboard/admin`. Don't assume `(admin)` is wired up to anything.

Each dashboard role (user / mentor / admin) has parallel component sets under `src/components/dashboard/{user,mentor,admin}` (e.g. `UserDashboard.js`/`MentorDashboard.js`/`AdminDashboard.js`, matching `*Sidebar.js`, `*AppointmentTab.js`, `*AppointmentUnit(Past).js`, `*Profile.js`) — when changing behavior for one role, check whether the equivalent needs mirroring in the other two.

### Role-based routing (`src/middleware.js` + `src/lib/supabase/proxy.js`)

All auth/session-refresh and role redirect logic lives in `updateSession()` in `src/lib/supabase/proxy.js`, called from `middleware.js` on every non-static request. It:
1. Refreshes the Supabase session via `getUser()` and re-syncs cookies.
2. Reads the caller's role from the `profiles` table (`user` / `mentor` / `admin`).
3. Redirects unauthenticated users away from `/dashboard`, `/admin`, `/setAccount`, `/resetPass`.
4. Redirects authenticated users to their role's dashboard when they hit the wrong area (e.g. a `user` hitting `/dashboard/mentor`, or `/setAccount` before `profiles.set` is `true`), and keeps admins out of the user/mentor onboarding flow entirely.

When adding a new top-level route, check whether it needs an entry in this middleware's role-gating logic, or it will silently be treated as public.

### Supabase access patterns (`src/lib/supabase/`)

- `client.js` — browser client (`createBrowserClient`), memoized singleton, for Client Components.
- `server.js` — server client (`createServerClient` + `next/headers` cookies) for Server Components/Actions; respects RLS as the logged-in user.
- `proxy.js` — used only by `middleware.js` to read/refresh the session cookie (see above).
- Many **API routes** (webhooks, `meeting/[meetingId]`, `mentor/payout`) instead construct a raw `@supabase/supabase-js` `createClient(url, NEXT_SECRET_KEY)` via `createAdminSupabaseClient()` — this uses the **service-role key and bypasses RLS**. Use this pattern only for trusted server-to-server operations (Stripe/LiveKit/Supabase webhooks, server-to-server calls authenticated via `NEXT_APIROUTE_SECRET`), never for user-facing requests. Note `mentor/payout` uses it *and* authenticates the caller itself, via `supabase.auth.getUser(token)` on the mentor's bearer token.

### Payments & mentor payouts

- One-off credit purchases: `api/checkout_sessions` creates a Stripe Checkout session; `api/webhooks/stripe` handles `checkout.session.completed` by updating `users.customer_id`, inserting into `payments`, then inserting into `credit_logs` (a DB trigger derives the running `credits`/`balance`, so app code never writes balances directly — always insert a `*_logs` row and let the trigger update the balance).
- Mentor payouts use Stripe Connect (`stripe_account_id` on `mentor_secret`) and are **application-based only** — there is no scheduled/batch payout. `api/mentor/payout` (POST, authenticated by the mentor's own bearer token) is the single path: it reads the balance from `mentor_balances`, requires `MIN_PAYOUT_AMOUNT`, deducts a flat `PAYOUT_FEE`, and inserts a `transfers` row with `status: "processing"` *before* calling Stripe. That insert is the concurrency guard — the partial unique index `transfers_one_processing_per_mentor` (`mentor_id` where `status = 'processing'`) makes a second concurrent request fail with `23505`, which the route turns into a 409. The `transfers.id` is then used as the Stripe `idempotencyKey`, so a retried request cannot double-pay. Balance consumption is recorded by inserting into `mentor_balance_logs` (never by writing `mentor_balances` directly).
- Reward accrual is entirely DB-side: `meeting_schedules.is_finished` flipping to `true` fires `add_mentor_balance_on_finished()`, which inserts `reason: "meeting_completed"` into `mentor_balance_logs` with `floor(credit_price * mentor_secret.transfer_rate)`; a second trigger then syncs `mentor_balances.balance`. **`credit_price` is currently `0` on purpose** — a free-trial measure, so balances do not grow and no mentor can reach `MIN_PAYOUT_AMOUNT`. A payout request returning "最低振込額に達していません" is therefore expected behavior right now, not a bug. Don't "fix" it. (It was `2000` until ~2026-08-20, and `reason: "trial_period_adjustment"` rows reversed the already-accrued balances. Both changes were made directly in the SQL editor and are **not in the migration history**.)
- Retryable Stripe error codes (`insufficient_funds`, `rate_limit`, `api_connection_error`) are treated as `pending` for later retry; anything else is `failed`.
- Historical note: payouts used to be a monthly cron sweep (`api/batch/transfer` + `CRON_SECRET` + Supabase pg_cron job `monthly-transfer` + RPCs `get_unpaid_periods` / `get_monthly_transfer_summary` + a `transfers.period` column). All of that was removed from the database on 2026-06-14 (migrations `recreate_transfers_table`, `cleanup_unused_functions_and_cron`) and the leftover route, its tests, and the orphaned `get_unpaid_amount()` RPC were removed afterwards. **Don't reintroduce `period`-based bookkeeping or a cron payout path.**

### Video consultations

LiveKit powers 1:1 video meetings. `api/livekit-token` mints a room-scoped `AccessToken` (`LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET`). Meeting scheduling state lives in the `meeting_schedules` table, mutated via `api/meeting/[meetingId]` (`PATCH`, actions: `set_schedule` / `delete_schedule` / `finish`), which is authenticated by a static `x-api-key` header (`NEXT_APIROUTE_SECRET`) rather than a user session — it's meant to be called server-to-server (e.g. from `api/webhooks/livekit`).

### File uploads

`api/r2_upload` issues a presigned S3 `PutObjectCommand` URL for Cloudflare R2 (`src/lib/r2.js`), keyed as `{role}/{userId}/{kinds}/{filename}` so uploads are namespaced per role/user. Requires a logged-in Supabase user; the client uploads directly to the presigned URL afterward.

### Articles

`api/article` proxies microCMS (`API_URL`/`API_KEY` env vars) for blog content, rendered under `(main)/articles`.

### UI

Tailwind CSS v4 + shadcn/ui (`components.json`: style `new-york`, base color `neutral`, icon library `lucide`). Only a few shadcn primitives are actually installed (`src/components/ui`: `alert-dialog`, `button`, `drawer`, `sonner`) — add more via `npx shadcn add <component>` rather than hand-rolling. `cn()` (clsx + tailwind-merge) lives in `src/lib/utils.js`.

## Environment variables

Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon/publishable, RLS-bound), `NEXT_SECRET_KEY` (service role — server-only, bypasses RLS), `SUPABASE_WEBHOOK_SECRET`.
Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
LiveKit: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL`.
Cloudflare R2: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ACCESS_KEY_ID`, `CLOUDFLARE_SECRET_ACCESS_KEY`, `CLOUDFLARE_BUCKET_NAME`/`CLOUDFLARE_R2_BUCKET_NAME`, `NEXT_PUBLIC_R2_PUBLIC_URL`.
microCMS: `API_URL`, `API_KEY`, `MICROCMS_PREVIEW_SECRET`.
Email: `SMTP_API_KEY` (Resend).
Misc auth: `NEXT_APIROUTE_SECRET`, `MY_SECRET_TOKEN`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_VERCEL_URL`. (`CRON_SECRET` is no longer read by any code — its only consumer was the removed `api/batch/transfer`. The remaining scheduled jobs are Supabase pg_cron jobs calling Edge Functions (`sync-to-notion`, `sync-meetings-to-notion`), which don't touch this app.)
