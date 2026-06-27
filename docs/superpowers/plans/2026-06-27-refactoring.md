# Dashboard Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved `REFACTORING.md` changes while keeping current app structure, style, and Supabase data contracts intact.

**Architecture:** Keep the existing Expo Router modal pattern and data-layer functions. Add small shared helpers for header actions, feedback, confirmations, input labels/tooltips, player registration drafts, and local notifications instead of restructuring screens.

**Tech Stack:** Expo SDK 56, React Native, Expo Router, Supabase, TypeScript, NativeWind, `StyleSheet.create()`, Lucide icons, local Expo notifications.

## Global Constraints

- Do not change app style/components unless necessary.
- Keep route modal pattern: `modal.tsx` receives search params and renders shared entity modal component.
- Use Supabase generated types from `types/database.types.ts`.
- Throw Supabase errors from data functions.
- Add `.abortSignal(AbortSignal.timeout(20000))` on list queries.
- Notifications scope is only: local reminder 30 minutes before a match starts.
- Player registrations scope is multiple `iscrizione` rows per player, one per tournament, at least one row.
- Create `RESULT.md` with changes and skipped items.

---

### Task 1: Contracts And Baseline

**Files:**
- Modify: `data/partite.ts`
- Modify: `data/tornei.ts`
- Create: `lib/registration-utils.ts`
- Create: `lib/notification-utils.ts`

**Interfaces:**
- Produces: `RegistrationDraft`, `validateRegistrationDrafts(registrations)`.
- Produces: `buildMatchReminderNotificationContent(match)`, `getReminderDate(kickoffIso, minutesBefore)`.

- [ ] Fix existing `listaPartiteType` list row alias.
- [ ] Return `partite: []` from `createTorneoSetup` fallback and `createTorneoCompleto` contract.
- [ ] Add pure helpers for registration validation and notification scheduling calculations.
- [ ] Verify helper contracts with TypeScript and one-off script where possible.

### Task 2: Header Actions And Feedback

**Files:**
- Modify: `components/generic/TabBarButton.tsx`
- Create: `components/generic/FeedbackModal.tsx`
- Create: `components/generic/SectionHeaderActions.tsx`
- Modify: `app/(app)/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes route params from Expo Router.
- Produces create, feedback, settings, and public redirect header buttons.

- [ ] Extend button component to support icons and external link press.
- [ ] Add feedback modal with developer emails and Instagram.
- [ ] Replace tab headerRight actions for Tornei, Partite, Squadre, Giocatori.
- [ ] Show public redirect only in modal `view` and `edit` with a valid record id.

### Task 3: Player Registration List

**Files:**
- Modify: `data/giocatori.ts`
- Modify: `components/giocatori/GiocatoreModal.tsx`
- Modify: `data/squadre.ts`

**Interfaces:**
- Consumes: `validateRegistrationDrafts`.
- Produces: create/update flows that insert/update/delete player `iscrizione` rows.

- [ ] Replace single registration state with `registrations: RegistrationDraft[]`.
- [ ] Load all player registrations and related squads.
- [ ] Add UI rows to add/remove tournament + team registrations.
- [ ] Validate at least one registration and no duplicate tournament.
- [ ] Preserve existing player field behavior and captain flag.

### Task 4: Local Match Reminder Notifications

**Files:**
- Modify: `package.json`
- Modify: `app.json`
- Create: `lib/notifications.ts`
- Modify: `app/(app)/impostazioni.tsx`

**Interfaces:**
- Produces: `getNotificationPermissionStatus()`, `requestNotificationPermission()`, `scheduleUpcomingMatchReminders()`.

- [ ] Add `expo-notifications`.
- [ ] Configure Android notification channel.
- [ ] Add settings permission request/status.
- [ ] Schedule local reminders 30 minutes before future matches.
- [ ] Skip unsupported web/native environments gracefully.

### Task 5: Tooltips And Form Safety

**Files:**
- Create: `components/input/InputLabel.tsx`
- Modify: `components/input/TextInputField.tsx`
- Modify: `components/input/GenericSelectField.tsx`
- Modify: `components/input/TeamSelectField.tsx`
- Modify: `components/input/DateTimePickerField.tsx`
- Modify: `components/input/ChipPickerField.tsx`
- Modify: `components/input/ColorPickerField.tsx`
- Create: `lib/confirm.ts`
- Modify: entity modal components

**Interfaces:**
- Produces: optional `tooltip?: string` prop on input wrappers.
- Produces: `confirmDiscardChanges(callback)`.

- [ ] Add optional tooltip icon next to labels.
- [ ] Use tooltip only on fields with non-obvious format requirements.
- [ ] Add discard confirmations to form reset/close actions.
- [ ] Keep intermediate wizard back buttons without confirmation.

### Task 6: Bug Fixes And Docs

**Files:**
- Modify: `components/tornei/TorneoModalForm.tsx`
- Modify: `components/squadre/SquadraCard.tsx`
- Modify: `README.md`
- Create: `RESULT.md`

**Interfaces:**
- Consumes existing `getSetupTorneo`, `updateTorneoSetup`.

- [ ] Use loaded edit categories in tournament edit UI.
- [ ] Save tournament edits through `updateTorneoSetup`.
- [ ] Display explicit no-captain label.
- [ ] Remove only certainly unused code touched by this work.
- [ ] Update README and write RESULT.md with skipped items.
- [ ] Run final verification and document any residual baseline issues.
