# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Framework note

This project uses Next.js 16. APIs and conventions may differ from older Next.js versions. Before changing Next-specific behavior, read the relevant guide under `node_modules/next/dist/docs/` and follow current deprecation guidance.

## Common commands

Use npm; `package-lock.json` is present.

```bash
npm run dev
```
Start the Next.js dev server on `http://localhost:3000`. The `predev` hook copies the PDF worker via `scripts/copy-pdf-worker.mjs`.

```bash
npm run build
```
Run `prisma generate` and `next build`.

```bash
npm run start
```
Start the production server after building.

```bash
npm run lint
```
Run ESLint across the repo.

```bash
npm run test:types
```
Run TypeScript with `tsc --noEmit`.

```bash
npm run test:unit
```
Run Vitest unit tests.

```bash
npm run test:unit -- src/lib/__tests__/quiz-shuffle.test.ts
```
Run a single Vitest test file.

```bash
npm run test:unit:coverage
```
Run Vitest coverage. Coverage is configured for `src/actions/**` and `src/lib/**` in `vitest.config.ts`.

```bash
npm run test:e2e
```
Run Playwright E2E tests. Locally, `playwright.config.ts` starts `npm run dev` with `.env.test` loaded and reuses `http://localhost:3000` when available.

```bash
npm run test:e2e:smoke
```
Run the Chromium smoke spec only.

```bash
npx playwright test e2e/quiz-anticheat.spec.ts --project=chromium
```
Run one E2E spec in one browser project. Playwright projects include `setup`, `chromium`, `firefox`, `mobile-chrome`, and `mobile-safari`; browser projects depend on `e2e/auth.setup.ts`.

```bash
npx prisma generate
```
Regenerate Prisma Client after schema changes.

```bash
npx prisma db seed
```
Seed development/test data using `prisma/seed.ts`. The seed uses `.env` and includes fixed edge-case data for schedules, homework, quizzes, tuition, PayOS links, documents, and calendar events.

```bash
npm run test:security
```
Run the local security check script.

```bash
npm run test:sitemap
```
Validate the sitemap.

## High-level architecture

- `src/app/` uses the App Router with route groups and role dashboards:
  - `src/app/(public)/` contains the landing site, public documents/news, admission pages, and public quizzes.
  - `src/app/(auth)/login/` contains login UI.
  - `src/app/admin/`, `src/app/teacher/`, `src/app/student/`, and `src/app/parent/` are protected dashboard areas with role-specific layouts.
  - `src/app/api/` contains route handlers for uploads, document proxy/download, attendance, teacher/admin data APIs, AI quiz generation, and PayOS webhooks.
- `src/proxy.ts` is the Next proxy/middleware entrypoint. It reads the JWT session and enforces dashboard access by role for `/admin`, `/teacher`, `/student`, `/parent`, plus `/login` redirects.
- Authentication is JWT-cookie based:
  - `src/actions/auth.ts` validates credentials with Prisma + bcrypt, signs a JWT via `src/lib/auth.ts`, and stores it in the `session_token` httpOnly cookie.
  - `src/lib/auth.ts` exposes `signJWT`, `verifyJWT`, `getSession`, and `getMiddlewareSession`.
  - Server Actions should call `getSession()` for authorization checks; client layouts that need current user data call `src/actions/session.ts`.
- Data access uses Prisma 7 with PostgreSQL:
  - `prisma/schema.prisma` defines roles, users/profiles, classes/subjects, schedules, attendance, grades, courses, quizzes, documents, calendar/events, tuition, and PayOS payment links.
  - `src/lib/db.ts` creates a `PrismaClient` with `@prisma/adapter-pg` and a `pg.Pool`; the Prisma datasource intentionally has no `url` field.
  - Migrations live under `prisma/migrations/`.
- Server Actions in `src/actions/` hold most dashboard mutations and reads (`attendance`, `calendar`, `classes`, `documents`, `grades`, `payment`, `quizzes`, `schedules`, `settings`, `subjects`, `tuition`, `users`, etc.). Prefer keeping role/business rules in these server-side modules rather than duplicating them in client components.
- Shared domain utilities live in `src/lib/`:
  - `schedule-expand.ts` expands `ScheduleSeries` + `ScheduleException` into runtime calendar instances. It normalizes schedule dates to UTC midnight and combines times using the fixed `Asia/Ho_Chi_Minh` timezone.
  - `quiz-shuffle.ts` is pure quiz paper generation/grading logic for server-side shuffled exam layouts. It must not leak `correctAnswer` or explanations into client paper payloads.
  - `recurrence.ts`, `dateUtils.ts`, `timeSlots.ts`, `tuition-utils.ts`, `payos*.ts`, `openrouter.ts`, `quiz-import.ts`, and PDF/storage helpers support their respective domains.
- Tests are split by level:
  - Vitest tests are mostly pure/unit tests under `src/lib/**/*.test.ts` and `src/lib/__tests__/`. `tests/setup.ts` mocks `@/lib/auth`, `next/cache`, and `@/lib/db` so unit tests do not hit the real database by default.
  - Playwright E2E tests live in `e2e/`, with auth state setup in `e2e/auth.setup.ts` and reusable auth fixtures under `e2e/fixtures/`.
- UI styling uses app-level globals in `src/app/globals.css`, Tailwind CSS 4 dependencies, and reusable components under `src/components/`. Calendar-specific UI is grouped in `src/components/calendar/`.
- File/document features integrate with Cloudinary/R2-style storage helpers and PDF.js. The dev/build hooks copy the PDF worker before Next starts or builds.

## Seed accounts and fixtures

`prisma/seed.ts` creates deterministic Vietnamese demo data. The default password for most seeded users is `Test@1234`; the root admin is `admin@eduweb.vn` with password `hungcuong123`. Notable seeded emails include `teacher.toan@eduweb.vn`, `parent1@eduweb.vn`, and `student1@eduweb.vn`.

The seed intentionally includes edge cases used by tests: schedule exceptions and conflicts, late/pending homework, absent/excused attendance, quiz deadlines/public guest submissions, duplicate PayOS references, fallback payment links, restricted documents, recurring calendar events, and optional/null relations.

## Environment notes

- Local Playwright uses `.env.test`; the Prisma seed currently loads `.env`.
- `DATABASE_URL` is required for real Prisma work. `src/lib/db.ts` has a mock fallback connection string for imports, but production/dev database operations need a real PostgreSQL URL.
- `JWT_SECRET` should be provided in real environments; `src/lib/auth.ts` has a development fallback string.
- Payment and upload features depend on their respective PayOS, Cloudinary/R2, and image-hosting environment variables.
