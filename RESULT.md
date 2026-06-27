# Result

## Changes Made

- Added shared section header actions for Tornei, Partite, Squadre and Giocatori:
    - create button hidden inside modal routes
    - public redirect button shown in `view` and `edit` modal modes
    - feedback button available from each section header
- Added a feedback modal with developer email links and the tournament Instagram page.
- Refactored player registrations in `GiocatoreModal` from a single registration to a list of registrations.
- Added validation so each player has at least one registration and cannot have multiple registrations for the same tournament.
- Added local match reminder notifications with `expo-notifications`.
- Limited notification behavior to the approved scope: one local reminder 30 minutes before kickoff.
- Connected notification permission request/status to the settings screen.
- Updated Expo SDK 56 package patch versions reported by `expo install --check`.
- Added optional tooltip support to form input wrappers and used it on fields with non-obvious formats.
- Fixed tournament edit category loading by displaying the categories from the selected tournament.
- Fixed tournament edit saving by calling `updateTorneoSetup`.
- Fixed squad captain display by hydrating captains from `squadra.id_capitano` instead of trusting arbitrary joined rows.
- Added confirmation dialogs before discarding create/edit form changes.
- Updated README content for the current feature set and project structure.
- Added focused helper tests for registration validation and notification reminder utilities.
- Fixed TypeScript list result aliases/contracts found during verification.

## Skipped

- Match-start, match-ended and report-confirmation notifications were not implemented because the approved scope was reduced to the 30-minute pre-match reminder only.
- Remote push notifications were not implemented; the app now uses local scheduled notifications on supported native platforms.
- Broad unused-code removal was limited to code touched by this refactor to avoid unrelated behavior changes.
- Existing `expo-doctor` app config issues were left unchanged: `newArchEnabled` schema warning and iOS bundle identifier `com.anonymous.dashboard_cdt`.
