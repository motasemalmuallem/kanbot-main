# Feature folder conventions

Keep each feature's root limited to its public `index.ts`. Put implementation files in the matching subfolder and expose stable UI/domain entrypoints from `index.ts` or `api/index.ts`. Other features should import through `@features/<feature>` or `@features/<feature>/api` instead of reaching into implementation files. Route definitions may lazy-load a feature's page directly to preserve route-based code splitting.

- `pages/`: route-level screens.
- `components/`: UI used only by this feature. Shared UI belongs in `src/shared/components`.
- `hooks/`: feature-specific React hooks.
- `api/`: API operations owned by this feature, exposed through `api/index.ts` for cross-feature use. The shared HTTP client and cross-cutting request behavior stay in `src/shared/api`.
- `lib/`: feature-specific helpers and business logic.
- `types/`: feature-only TypeScript types; shared API types stay in `src/shared/types`.
- `constants/`: feature-specific constants and configuration.
- `context/`: feature-scoped React context and providers.

Folders are scaffolding; add files when there is real code to place there. A feature with no implementation yet can keep an empty `index.ts` until it grows.

## Shared library usage

Use each library where the feature needs its behavior; do not add every package to every feature just to make the dependency list look uniform.

- `react-router`: the shared route tree lives in `src/router.tsx`; feature pages use its navigation, route params, and search params.
- `@tanstack/react-query`: the provider is configured in `src/main.tsx`. Feature hooks own server reads and mutations for auth, projects, todos, sprints, board, backlog, and AI, including cache invalidation and optimistic moves.
- `react-hook-form`, `zod`, and `@hookform/resolvers`: form state and schema validation are used in auth, project, todo, sprint, and backlog quick-create/sprint dialogs.
- `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`: accessible drag-and-drop is used where tasks can be reordered or moved: backlog and board.
- `react-markdown`: shared Markdown rendering lives in `src/shared/components/MarkdownContent.tsx` and is used for assistant messages and sprint summaries. Raw HTML stays disabled.
- `date-fns`: date calculations and formatting helpers are used in backlog sprint dates and board sprint timing. UI locale formatting remains in the language provider where needed.

