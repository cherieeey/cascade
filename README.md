# Cascade

Cascade is a clean three-person CICD project starter based on the CA1 project
format. It uses Express, Prisma with PostgreSQL, Playwright, ESLint, and GitHub
Actions.

## Team

Replace the placeholders below before your first submission.

| Member | Student ID | GitHub username | Main responsibility |
| --- | --- | --- | --- |
| Member 1 | TBC | `@member-one` | Backend / API |
| Member 2 | TBC | `@member-two` | Frontend / UX |
| Member 3 | TBC | `@member-three` | Database / testing |

Also replace the usernames in `.github/CODEOWNERS`.

## First-time setup

1. Install Node.js 22 and PostgreSQL.
2. Copy `.env.example` to `.env.development` and `.env.test`.
3. Give the two databases different names, for example `cascade` and
   `cascade_test`.
4. Run:

```sh
npm install
npx playwright install chromium
npm run db:migrate:dev -- --name init
npm run db:seed:dev
npm run dev
```

Open `http://localhost:3000/health` to confirm the app is running.

## Daily commands

```sh
npm run dev
npm run lint
npm test
npm run test:ui
```

## Three-person Git workflow

- Protect `main`; use it only for stable releases.
- Integrate completed work through `develop`.
- Each member works on a branch such as `feature/member1-login`.
- Open a pull request into `develop` and get one teammate to review it.
- Do not commit `.env` files or database passwords.

## Project layout

```text
.github/       CI workflow, CODEOWNERS, pull request template
configs/       ESLint and Playwright configuration
prisma/        Database schema, migrations, and seed data
src/           Express application, routes, and server
tests/         Playwright tests
```
