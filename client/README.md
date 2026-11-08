# Kanbot Client

Kanbot is a personal project and sprint planner with an AI assistant. The client is a React 19, TypeScript, and Vite application; the API lives in the sibling `server/` directory.

## Run locally

Use two terminals from the repository root.

```powershell
# Terminal 1: API
cd server
npm install
Copy-Item .env.example .env   # only needed for a fresh checkout
npm run dev                   # http://localhost:4000/api
```

```powershell
# Terminal 2: client
cd client
npm install
npm run dev                   # http://localhost:5173
```

The default API configuration uses the built-in mock AI and needs no external key. To use Groq or another OpenAI-compatible provider, set `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` in `server/.env`. Keep provider keys on the server; never put them in a `VITE_*` variable. The model must be enabled for the selected provider account.

For a populated demo account, run `npm run seed` in `server/`. **Seeding resets the local JSON database** at `server/data/db.json`; save or back up local data first. The demo credentials are `demo@kanbot.dev` / `password123`.

## Design and UI choices

- **Visual direction:** a dark, compact workspace with zinc surfaces, thin borders, restrained violet focus accents, and clear status colors. It keeps task details dense while giving board cards and dialogs enough separation.
- **Typography:** Geist for the main interface, with the bundled IBM Plex Sans Arabic font as a fallback.
- **Styling:** Tailwind CSS v4 utility classes for component and responsive layouts, with the shared color, typography, and spacing tokens defined in `src/index.css`. The unused legacy `dashboard.css` token file has been removed so the app has one active design-token source.
- **Icons:** Lucide React, chosen for a consistent line weight and accessible icon components.
- **Interaction:** React Router owns the route tree; TanStack Query feature hooks own server state; React Hook Form + Zod validate auth, project, todo, and sprint forms, plus backlog quick-create; `@dnd-kit` handles backlog and board drag-and-drop; `react-markdown` renders assistant and sprint-summary Markdown (raw HTML is not enabled); `date-fns` handles sprint date calculations. See [`src/features/README.md`](src/features/README.md) for the feature-level library map.

## Structure

```text
src/
├── features/
│   ├── ai/       # assistant, saved chat history, AI API
│   ├── app/      # authenticated application shell
│   ├── auth/     # auth pages, provider, hooks, schemas, API
│   ├── backlog/  # backlog list, row, filters and sprint planning UI
│   ├── board/    # active sprint board
│   ├── projects/ # project list and project forms
│   ├── sprints/  # sprint history/details and API
│   └── todos/    # todo details and todo API
└── shared/       # HTTP client, API types, reusable UI and shared styles
```

Each feature exposes its stable entrypoints from `index.ts` or `api/index.ts`. Cross-feature imports use the `@features/*` alias; general-purpose code belongs in `shared/`.

## Implemented scope

- Authentication: registration, login, restored sessions, route guards, logout, and expired-session handling.
- Projects: list, search, create, edit, project switching, and confirmed deletion.
- Backlog and todos: quick create, details/edit/delete, search and filters, ordering, and moving tasks between backlog and planned sprints.
- Sprints and board: plan/edit/delete/start/complete sprints, drag-and-drop status changes, progress, history, and completed sprint details.
- AI-1…AI-5: chat with Markdown, editable todo drafts and bulk save, capacity-aware sprint suggestions, saved/regeneratable summaries, and loading/error/retry states. AI status reports Mock mode when the API is using its mock provider.
- The UI supports English and Arabic. Arabic sets RTL direction and uses Arabic date/number formatting; user-provided project names, descriptions, todo content, and AI responses remain as entered/generated.
- Theme choice, language choice, and AI chat history are saved in browser `localStorage`. Chat history is scoped by user and project; logout does not clear it. These settings stay on that browser and do not sync to other devices.
- Responsive navigation collapses to a drawer at widths up to and including 768px; the board switches to horizontally scrollable columns at the same breakpoint. Backlog rows switch to compact cards on tablet and narrower desktop layouts.

## NFR review and verification

- **NFR-1:** React + strict TypeScript + Vite. Client lint and production build pass without warnings. Route-level lazy loading is combined with entry-aware vendor splitting; the largest emitted JavaScript chunk is about 352 kB (uncompressed).
- **NFR-2–3:** project, backlog, sprint, board, and AI flows provide loading/empty/error or retry feedback; mutations provide inline feedback/toasts, and destructive actions require confirmation.
- **NFR-4:** the app shell switches to a drawer at `≤768px`; the board uses horizontally scrollable columns at `≤768px`; Backlog uses responsive task cards on tablet and narrower desktop layouts.
- **NFR-5:** labelled and semantic controls, visible keyboard focus, dialogs with Escape handling and focus trapping, status text/icons, and non-drag task actions are implemented. A token-level contrast audit covers the main text/surface pairs, status badges, focus indicators, and strong control borders: the lowest audited small-text ratio is 4.61:1 in each theme, status text is at least 5.02:1, strong control borders are at least 3.12:1, and focus indicators are at least 4.80:1. This is a palette audit, not a full rendered-page WCAG certification.
- **NFR-6:** backlog search uses a 300ms debounce; drag-and-drop task moves update optimistically and roll back when the server rejects the move. Some dependent requests, such as resolving the active sprint before loading its board, remain sequential by design.
- **NFR-7:** AI Markdown renders without raw HTML and provider credentials stay on the server. The base brief says only JWT should be stored client-side; the requested theme, language, and per-user/project chat persistence are additional local-only `localStorage` features, documented above.
- **NFR-8:** feature-owned API modules/types and shared HTTP infrastructure keep fetch logic out of page components.
- **NFR-9:** the source brief requests English-only, but the later product request explicitly asked for Arabic/English. The app follows that newer request and switches direction to RTL in Arabic. User-authored and AI-generated content is not translated.

Known limitations: chat history is local to one browser; no cross-device chat sync, offline mode, unit-test suite, or Playwright end-to-end suite is included. The contrast review is token-based and does not certify every rendered state or native browser control. The backend uses a local JSON file for development data.

## Checks

```powershell
npm run lint
npm run build
```

Backend checks are in `server/`: `npm run typecheck` and `npm run smoke`. The smoke command uses a temporary database and forces Mock AI.

## Demo walkthrough

See [`DEMO-SCRIPT.md`](DEMO-SCRIPT.md) for the short live walkthrough: register → create a project → draft and save AI todos → plan and start a sprint → move board cards → complete the sprint → review its AI summary.

## Optional enhancements (§9)

- Dark/light theme with the dark theme as the default and preference persistence.
- English/Arabic UI with RTL layout and localized date/number formatting.
- Per-user/project chat history saved locally in the browser.
- Responsive drawer navigation, scrollable board columns on tablet, hover hints, and focused loading/error feedback.
