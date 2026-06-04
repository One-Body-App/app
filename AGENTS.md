# Codex Agent Instructions (App)

## Scope

- React Native app in `app/` (iOS/Android; web planned).
- Consumes the same NestJS API (`api/`) that also serves `one-body-admin/`; keep contracts compatible with admin and API changes.

## Architecture & Data

- Data flows through the shared API (DigitalOcean droplet) backed by MongoDB and OpenSearch; breaking API contracts will impact the app and admin.
- Auth/analytics: respects API-driven auth and GA4 integrations configured server-side.

## Project conventions

- Follow existing component structure in `src/`.
- Cross-check every change against the equivalent area in `web/`. Mobile changes must verify whether the web app needs the same behavior, and web changes should follow the mobile app's established behavior where applicable. If the feature or equivalent surface does not exist in the other client, ask whether it should be added.
- Keep hook usage unconditional and ordered; avoid conditional hooks.
- Do not import or call `useEffect` / `React.useEffect` directly in frontend code.
- Prefer derived state, event handlers, Redux/saga flows, `useFocusEffect`, and keyed remounts before reaching for lifecycle synchronization.
- Use `useMountEffect` only for true mount/unmount external sync such as listeners, subscriptions, and third-party integrations.
- Do not change `UIViewControllerBasedStatusBarAppearance` in `ios/onebody/Info.plist`.
- Do not add screen-level `StatusBar` usage for iOS. In this app it can conflict with the plist-based status bar configuration and trigger iOS runtime crashes.
- If an Android screen needs status bar styling, gate that behavior to Android only and avoid changing shared iOS status bar behavior as part of the fix.
- Prefer TypeScript where present; use ASCII-only text for edits and comments.
- Keep changes minimal and focused on the requested scope.

## Env/Deployment

- Mobile builds depend on `.env*` config for API base URLs and keys; do not change env files unless explicitly asked.
- Do not read or print values from `.env.local` or other local secret env files. Use `.env.example` for env variable names, expected shape, and documentation.
- Never include secret values, private tokens, keys, or local-only env values in responses, logs, commits, or docs.
- Be mindful of staging vs production endpoints shared with admin.

## Testing

- If UI or behavior changes, suggest the relevant screen-level manual check (iOS/Android).
- If automated tests exist for the touched area, run or suggest them.
- Do not load the module under test with `const { ... } = require('./module')` (CommonJS `require` returns `any`, so `.map`/`.every`/etc. callbacks become implicit-`any` and fail `tsc`). Use a typed ES `import` instead — `jest.mock(...)` is hoisted above imports, so the mock still applies before the module loads.

## Safety

- Do not touch unrelated files.
- Do not modify `.env*` files unless explicitly asked.
