# Codex Agent Instructions (App)

## Scope

- React Native app in `app/` (iOS/Android; web planned).
- Consumes the same NestJS API (`api/`) that also serves `one-body-admin/`; keep contracts compatible with admin and API changes.

## Architecture & Data

- Data flows through the shared API (DigitalOcean droplet) backed by MongoDB and OpenSearch; breaking API contracts will impact the app and admin.
- Auth/analytics: respects API-driven auth and GA4 integrations configured server-side.

## Project conventions

- Follow existing component structure in `src/`.
- Keep hook usage unconditional and ordered; avoid conditional hooks.
- Do not import or call `useEffect` / `React.useEffect` directly in frontend code.
- Prefer derived state, event handlers, Redux/saga flows, `useFocusEffect`, and keyed remounts before reaching for lifecycle synchronization.
- Use `useMountEffect` only for true mount/unmount external sync such as listeners, subscriptions, and third-party integrations.
- Prefer TypeScript where present; use ASCII-only text for edits and comments.
- Keep changes minimal and focused on the requested scope.

## Env/Deployment

- Mobile builds depend on `.env*` config for API base URLs and keys; do not change env files unless explicitly asked.
- Be mindful of staging vs production endpoints shared with admin.

## Testing

- If UI or behavior changes, suggest the relevant screen-level manual check (iOS/Android).
- If automated tests exist for the touched area, run or suggest them.

## Safety

- Do not touch unrelated files.
- Do not modify `.env*` files unless explicitly asked.
