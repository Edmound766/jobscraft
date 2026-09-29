# JobsCraft

Stop reformatting your résumé for every job.

JobsCraft lets you enter your career once — experience, projects, skills, education, certifications — and then generates a role-tailored, shareable résumé page for each job you apply to. Paste a job description, and JobsCraft ranks your entries by relevance, picks the ones that matter, and publishes them at a clean URL recruiters can open without logging in or downloading a PDF.

## Features

- **Master repository** — one place for experiences, projects, skills, education, certifications, and a professional summary.
- **Role matching** — paste a job description and your entries are scored for relevance by an LLM, with a keyword-based fallback if the agent is unavailable.
- **Shareable pages** — each generated page lives at `/u/<slug>`, with a match score, publish/unpublish control, and owner-only editing of what's included.
- **Rate limiting** — a 30-second cooldown and a daily cap of 15 generated pages per user.

## Repository layout

| Directory | What it is |
| --- | --- |
| [`jobscraft/`](jobscraft/) | The web app: TanStack Start (SolidJS), Tailwind, Drizzle + Postgres, Better Auth |
| [`agent/`](agent/) | A small Python service (Litestar + smolagents) that ranks résumé entries against a job description |

The web app calls the agent's `POST /rank` endpoint through `AGENT_URL`. If that request fails, it falls back to local keyword ranking, so the agent is optional for local development.

## Quick start

You'll need [Bun](https://bun.sh), [uv](https://docs.astral.sh/uv/), Python 3.14+, and a PostgreSQL database.

```bash
# 1. Agent (optional)
cd agent
export OPENROUTER_API_KEY=...
uv run litestar --app agent.main:app run --port 8000

# 2. Web app
cd ../jobscraft
bun install
# create .env.local — see jobscraft/README.md
bun run db:migrate
bun --bun run dev                  # http://localhost:3000
```

See [`jobscraft/README.md`](jobscraft/README.md) and [`agent/README.md`](agent/README.md) for details.
