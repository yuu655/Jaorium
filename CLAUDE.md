# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

JaoRium (jaorium.com) is a Japanese online mentoring platform connecting exam-prep students (受験生) with mentors (先輩/alumni) for paid video consultations. Built with Next.js App Router, plain JavaScript (no TypeScript — see `jsconfig.json`), Supabase (auth + Postgres), Stripe (payments/payouts), LiveKit (video calls), Cloudflare R2 (file storage), Resend (email), and microCMS (blog articles).

## Commands

```bash
npm run dev        # start dev server (localhost:3000)
npm run build      # production build
npm run start      # run production build
npm test           # run the Vitest suite once
npm run test:watch # Vitest in watch mode
```

Run a single test file with `npx vitest run path/to/file.test.js`.

Tests use **Vitest** (`vitest.config.mjs`), colocated as `*.test.js` next to the code under test. There is no React component/UI testing set up yet (no jsdom/Testing Library) — existing tests cover pure utils, API route handlers, and server actions, all via mocked Supabase/Stripe/Resend clients (see `src/test/supabaseMock.js` for the shared Supabase mock builder).

The old password-based signup remnants (`signup/user/actions.js`'s `signupMentor()` and `signup/mentor/actions.js`'s `signupUser()`) — unused leftovers from before the OTP-based flow, one of which had a `signup_mentor()` bug stamping `user_metadata.role` as `"user"` on mentor signups — have been removed along with their tests. Current signup only uses the OTP-based `signupUser`/`signupMentor` exports in each page's `actions.js`. (Three related bugs — an `app_metadata.role`-based admin check in `api/mentor/route.js`, a no-op password-confirmation check in `signup/mentor/actions.js`, and unsanitized path segments in `api/r2_upload/route.js` — were already found and fixed, each with a regression test.)

There is no lint script configured in `package.json`, and no ESLint config exists in the repo — don't assume `npm run lint` exists.

Path alias: `@/*` → `./src/*` (see `jsconfig.json`).

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
- Many **API routes** (webhooks, cron/batch jobs, `meeting/[meetingId]`, `mentor/payout`) instead construct a raw `@supabase/supabase-js` `createClient(url, NEXT_SECRET_KEY)` — this uses the **service-role key and bypasses RLS**. Use this pattern only for trusted server-to-server operations (Stripe/LiveKit/Supabase webhooks, cron jobs authenticated via `CRON_SECRET`/`NEXT_APIROUTE_SECRET`), never for user-facing requests.

### Payments & mentor payouts

- One-off credit purchases: `api/checkout_sessions` creates a Stripe Checkout session; `api/webhooks/stripe` handles `checkout.session.completed` by updating `users.customer_id`, inserting into `payments`, then inserting into `credit_logs` (a DB trigger derives the running `credits`/`balance`, so app code never writes balances directly — always insert a `*_logs` row and let the trigger update the balance).
- Mentor payouts use Stripe Connect (`stripe_account_id` on `mentors`). `api/mentor/payout` lets a mentor self-trigger a payout (deducts a flat `PAYOUT_FEE`, requires `MIN_PAYOUT_AMOUNT`); `api/batch/transfer` is a cron job (auth'd via `CRON_SECRET`) that sweeps all unpaid periods via Supabase RPCs (`get_unpaid_periods`, `get_monthly_transfer_summary`) and mirrors the same pending/completed/failed bookkeeping into the `transfers` table, emailing mentors via Resend when Stripe onboarding is incomplete.
- Retryable Stripe error codes (`insufficient_funds`, `rate_limit`, `api_connection_error`) are treated as `pending` for later retry; anything else is `failed`.

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
Misc auth/cron: `CRON_SECRET`, `NEXT_APIROUTE_SECRET`, `MY_SECRET_TOKEN`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_VERCEL_URL`.
