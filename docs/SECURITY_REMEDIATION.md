# Mobile security changes

Chat Keychain slots are scoped by API environment and API user ID. Verified legacy keys remain available for old messages, while new keys and immutable device IDs protect new traffic. Logout/account changes clear active state, peer caches, pending setup and sockets. Storage failures do not silently replace keys. `box:v1` is preserved and device envelopes interoperate with the browser client.

The release workflows now use repository-scoped GitHub credentials, explicit permissions and pinned actions. They no longer print environment values or interpolate secret contents into executable shell text. Git/Docker exclusions and a PR/weekly secret scanner prevent recurrence. GitHub secret scanning and push protection are enabled for this repository. After the workflow is published and passes, apply `.github/security-ruleset.json` to require `secret-scan`.

Removed historical-style upload signing password literals from `android/gradle.properties`. Only the standard debug keystore is currently tracked. The release owner must determine whether the old upload passwords or key were reused/exposed, and rotate/reset the upload credential where needed. Public Firebase/Giphy/reCAPTCHA identifiers remain client configuration; scanner exceptions are narrowly scoped and their provider restrictions still need review.

Validation: 50 chat/logout tests pass, including retained-key history and pending socket work after logout. TweetNaCl/libsodium `box:v1` interoperability was also checked. Full-project TypeScript has existing failures and is not a clean gate. Perform iOS and Android checks for sign-in, account A/B switching, logout during setup, old message history, new cross-device text/media, group chat and generic background notifications. Test release signing through the updated CI flow.

Remaining dependency advisories are recorded in `security-advisories.json`; no critical advisories remain in that report. Native Firebase, URL parsing and build-tool follow-ups need reachability/compatibility review. No local secret env file was read or modified.

The full incident and deployment runbook is in the API repository at `docs/SECURITY_REMEDIATION.md`, with validation/triage in `docs/SECURITY_VALIDATION.md`. **The exposed Firebase service-account key is still unconfirmed/unrevoked (P0); disabling it is an immediate Google Cloud administrator action.** History cleanup follows revocation. No deployment or shared-history rewrite has been performed.
