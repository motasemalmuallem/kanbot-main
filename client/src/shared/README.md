# Shared code

Use this directory for code that is genuinely reusable across multiple features. Feature-only code belongs in its feature folder.

- `api/`: shared HTTP client and cross-cutting request behavior. Domain API operations belong to their owning feature and are exposed through that feature's `api/index.ts`.
- `components/`: reusable UI components; prefer the `ui/` collection for general controls.
- `types/`: types shared across features and API boundaries.

Add other shared folders only when a real cross-feature need appears. Import shared modules with the `@shared/...` alias.
