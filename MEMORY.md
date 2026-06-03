# Memory

- Do not read or print values from `.env.local` or other local secret env files. Work from `.env.example` for env variable names, expected shape, and documentation.
- Never include secret values, private tokens, keys, or local-only env values in responses, logs, commits, or docs.
- Do not start local dev servers unless the user explicitly asks for one.
- Cross-check every change against the equivalent area in `web/`. Mobile changes must verify whether the web app needs the same behavior, and web changes should follow the mobile app's established behavior where applicable. If the feature or equivalent surface does not exist in the other client, ask whether it should be added.
