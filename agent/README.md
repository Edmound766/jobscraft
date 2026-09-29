# JobsCraft agent

A small HTTP service that scores résumé entries against a job description with an LLM. The JobsCraft web app calls it when a user generates a role page.

Built with [Litestar](https://litestar.dev) and [smolagents](https://github.com/huggingface/smolagents), using an OpenAI-compatible model through [OpenRouter](https://openrouter.ai).

## Setup

Requires Python 3.14+ and [uv](https://docs.astral.sh/uv/).

```bash
uv sync
export OPENROUTER_API_KEY=sk-or-...
uv run litestar --app agent.main:app run --port 8000
```

Then set `AGENT_URL=http://localhost:8000` in the web app's `.env.local`.

### Environment

| Variable | Required | Description |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | yes | API key for OpenRouter |

The model is set in `src/agent/main.py` (currently `openrouter/free`).

## API

### `POST /rank`

Scores each entry from 0 to 100 for relevance to the job description.

Request:

```json
{
  "job_description": "Senior backend engineer, Postgres, Node.js...",
  "entries": [
    {
      "id": "7f3c...",
      "kind": "experience",
      "text": "Led migration to an event-driven architecture...",
      "tech_stack": ["Postgres", "Node.js"]
    }
  ]
}
```

`kind` is either `experience` or `project`.

Response:

```json
{
  "rankings": [
    { "id": "7f3c...", "score": 92, "reason": "Direct Postgres and Node.js backend experience" }
  ]
}
```

The web app keeps entries that score 40 or higher. If none do, it keeps everything. If this service errors or can't be reached, the app falls back to keyword ranking.
