# JobsCraft web app

The JobsCraft web app. Users build a master repository of their career, paste job descriptions, and publish role-tailored résumé pages at `/u/<slug>`.

## Stack

- [TanStack Start](https://tanstack.com/start) with SolidJS, file-based routing, and server functions
- [Tailwind CSS v4](https://tailwindcss.com)
- [Drizzle ORM](https://orm.drizzle.team) on PostgreSQL
- [Better Auth](https://www.better-auth.com) for email/password auth
- [Nitro](https://nitro.build) as the server adapter
- [Biome](https://biomejs.dev) for linting and formatting

## Getting started

Requires [Bun](https://bun.sh) and a PostgreSQL database.

```bash
bun install
```

Create `.env.local`:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/jobscraft
BETTER_AUTH_SECRET=...            # generate with: bunx --bun @better-auth/cli secret
BETTER_AUTH_URL=http://localhost:3000
AGENT_URL=http://localhost:8000   # the ranking agent (see ../agent)
```

Apply the database migrations and start the dev server:

```bash
bun run db:migrate
bun --bun run dev   # http://localhost:3000
```

`AGENT_URL` is optional. If the agent can't be reached, role pages are ranked with keyword matching instead.

## Scripts

| Command | Description |
| --- | --- |
| `bun --bun run dev` | Start the dev server on port 3000 |
| `bun --bun run build` | Production build |
| `bun run start` | Run the production server (`.output/server/index.mjs`) |
| `bun run generate-routes` | Regenerate `src/routeTree.gen.ts` |
| `bun run lint` / `format` / `check` | Biome lint, format, or both |
| `bun run db:generate` | Generate a migration from schema changes |
| `bun run db:migrate` | Apply migrations |
| `bun run db:push` | Push the schema directly (dev only) |
| `bun run db:studio` | Open Drizzle Studio |

## Project structure

```
src/
  routes/          File-based routes
    _app.tsx         Main layout (full header) for the app pages
    _app.index.tsx   Landing page
    _app.dashboard.tsx  Master repository: profile, experience, projects, skills, education, certifications
    _app.roles.*     List generated role pages / create a new one from a job description
    u.$slug.tsx      Public, role-tailored résumé page (minimal header)
    api/auth/$.ts    Better Auth handler
  lib/             Server functions and domain logic
    roles.ts         Role page generation, rate limiting, publish/unpublish
    agentRank.ts     Client for the agent's /rank endpoint
    rank.ts          Keyword-ranking fallback
  db/              Drizzle schema (app + auth) and client
drizzle/           Generated SQL migrations
```

## How role pages are generated

1. The user submits a role title and job description on `/roles/new`.
2. Rate limits are checked: a 30-second cooldown between pages and at most 15 per day (UTC).
3. Experiences and projects are sent to the agent for semantic scoring. Entries scoring 40 or higher are kept. If the agent fails, keyword ranking is used instead, where an entry needs at least one tech-stack match to be kept.
4. Education and certifications are always included in full.
5. A unique slug is generated and the page is saved as **unpublished**. The owner can preview it, adjust which entries are shown, and publish it when ready.

Unpublished pages are only visible to their owner.

## Deployment

```bash
bun --bun run build
node .output/server/index.mjs
```

The build output is a self-contained Node server. Set the same environment variables in production. See the [Nitro deploy docs](https://nitro.build/deploy) for host-specific presets.
