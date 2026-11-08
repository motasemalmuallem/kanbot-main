# Kanbot API

Express 5 + TypeScript. Local JSON storage in development, optional Neon PostgreSQL storage in production. JWT auth. AI assistant through any OpenAI-compatible API, with a free built-in mock.

```bash
npm install
cp .env.example .env
npm run seed     # reset DB: demo@kanbot.dev / password123 (2 projects, 3 sprints, 24 todos)
npm run dev      # http://localhost:4000/api (auto-reload)
npm run smoke    # end-to-end test of every endpoint on a temp DB
npm run typecheck
```

- **API reference:** [docs/IMPLEMENTATION-PLAN.en.md §4](../docs/IMPLEMENTATION-PLAN.en.md#4-backend-api-design)
- **Types (the contract):** [`src/types/api.ts`](src/types/api.ts). Copy this file into the frontend.
- **Data:** `data/db.json`. Delete it or re-seed to start fresh.
- **Production storage:** set `DATABASE_URL` to a Neon PostgreSQL connection string. The API creates its JSONB storage table during startup; `npm run seed` can initialize the demo dataset and replaces the existing dataset.
- **Hosting:** deployment templates are in the repository root (`render.yaml`, `netlify.toml`). See [`DEPLOYMENT.ar.md`](../DEPLOYMENT.ar.md) for the Netlify + Render + Neon setup.

## AI configuration

| `.env` | Behaviour |
|---|---|
| `AI_API_KEY` empty (default) | **Mock mode**: rule-based answers, instant, free, offline. `GET /api/ai/status` → `{ "mode": "mock" }` |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` set | **Real LLM** via `POST {AI_BASE_URL}/chat/completions` (OpenRouter, Groq, Gemini, Ollama… see `.env.example`) |

The server validates everything the model returns: enums are coerced, story points are snapped to 1/2/3/5/8/13, sprint plans only contain real backlog ids within capacity. If the model returns unusable JSON for todos or a plan, the mock result is used instead. AI routes are limited to 20 requests per minute per user.

## Structure

```
src/
├── app.ts / index.ts        # express app, routes mounting, startup
├── config/env.ts            # validated environment
├── types/api.ts             # API contract (shared with the client)
├── db/store.ts              # JSON-file development store / Neon PostgreSQL production store
├── services/board.service.ts# ownership checks, ordering, sprint stats, serializers
├── routes/                  # auth, projects, todos, sprints, ai (+ zod schemas)
├── ai/                      # client.ts (OpenAI-compatible fetch), assistant.service.ts (real + mock)
├── middleware/              # auth, validation, errors, request logger
├── lib/                     # jwt, password hashing, errors
└── scripts/                 # seed.ts, smoke.ts
```
