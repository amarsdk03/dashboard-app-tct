# Giocatori Screen Design

## Goal

Build the complete admin flow for the `Giocatori` tab: searchable/filterable player list, player detail view, edit flow, and two-step create wizard that creates both a `giocatore` row and its `iscrizione` row.

## Scope

In scope:
- Replace the placeholder `app/(app)/(tabs)/giocatori/index.tsx` with a real list screen.
- Add a nested Giocatori stack and modal route matching the Tornei pattern.
- Add reusable Giocatori domain components for cards and modal/wizard UI.
- Extend `data/giocatori.ts` with Supabase functions for list, detail, create, and update.
- Reuse `data/tornei.ts` and `data/squadre.ts` to populate tournament/team selectors.
- Keep UI visually aligned with `assets/screen-mockups/lista-giocatori.jpeg`.
- Keep implementation style aligned with the existing Tornei screen and modal.

Out of scope for this iteration:
- Delete operations.
- Bulk import.
- Player statistics charts.
- Notifications.
- Photo upload/storage. The flow accepts image URLs only, matching current project patterns.
- Dedicated management screens for `campo`, `staff`, `trofeo`, or `categoria`.

## User Decisions

- The Giocatori feature must include the full flow, not only the list.
- Creating a player must also create an `iscrizione`.
- The create form is a two-step wizard:
  1. Player personal/sport profile.
  2. Tournament and team registration.
- The list uses a tournament selected through filters, not an implicit hidden default.
- Editing a player can update both anagrafica fields and registration fields for the selected tournament.
- Quick tabs match the mockup: `Tutti`, `Quest'anno`, `Capitani`.
- Advanced filters include `torneo`, `squadra`, `ruolo`, and `capitano`.
- Recommended approach selected: complete but modular implementation.

## Existing Context

The repo is an Expo React Native app with Expo Router, NativeWind, StyleSheet styles, Supabase, and generated database types in `types/database.types.ts`.

Existing Giocatori state:
- `app/(app)/(tabs)/giocatori/index.tsx` is a placeholder.
- `data/giocatori.ts` already has:
  - `getListaGiocatori(searchParam, idTorneo, currentPage, resultsPerPage)` using the `ricerca_giocatori` view.
  - `getDatiGiocatore(idGiocatore)` selecting from `giocatore`.
  - `getStatisticheGiocatore(idGiocatore)` selecting from `azioni_giocatori`.

Existing patterns to preserve:
- Follow Tornei route shape: nested tab stack, `modal.tsx` bridge, shared domain modal.
- Use `@/` imports.
- Use `InterText` for native text that needs Inter.
- Use NativeWind for layout/spacing and `StyleSheet.create()` for exact values, shadows, and complex styles.
- Use Supabase views for joined reads.
- Add `.abortSignal(AbortSignal.timeout(20000))` on list queries.
- Throw Supabase errors from the data layer and let UI show `errorMessage`.
- Export return-derived type aliases for every data function.
- Prefer `Tables`, `TablesInsert`, `TablesUpdate`, and `Enums` from `types/database.types.ts` instead of manual database payload types.

## Database Model

Relevant tables:
- `giocatore`
  - Required insert fields: `nome`, `cognome`.
  - Useful fields: `link_foto`, `nazionalita`, `data_nascita`, `nome_maglia`, `numero_maglia`, `ruolo_principale`, `piede_principale`, `altezza`, `peso`, `username_ig`, `is_capitano`.
- `iscrizione`
  - Required insert fields: `id_giocatore`, `id_squadra`, `id_torneo`.
  - Optional field: `dettagli`.
- `torneo`
  - Used for selecting/filtering the current tournament.
- `squadra`
  - Used through `ricerca_squadre` for tournament-specific team choices.

Relevant views:
- `ricerca_giocatori`
  - Primary list source. Includes player, team, and tournament fields.
- `ricerca_squadre`
  - Team selector source filtered by tournament.
- `azioni_giocatori`
  - Optional statistics source, not required for the first modal version.

Relevant enums:
- `ruolo_giocatore`: `Tecnico`, `Portiere`, `Difensore`, `Centrocampista`, `Attaccante`.
- `piede_principale`: `Destro`, `Sinistro`, `Entrambi`.

## Route Design

Add:

```text
app/(app)/(tabs)/giocatori/
  _layout.tsx
  index.tsx
  modal.tsx
```

`_layout.tsx` registers:
- `index` with `headerShown: false`.
- `modal` with `presentation: 'modal'` and `headerShown: false`.

`modal.tsx` reads:
- `mode?: 'view' | 'create' | 'edit'`
- `giocatoreId?: string`
- `torneoId?: string`

Default behavior:
- Missing or invalid `mode` falls back to `create`.
- `giocatoreId` and `torneoId` are parsed to numbers when present.
- `onClose` uses `router.back()` when possible, otherwise `router.replace('/giocatori')`.

Navigation:
- Create button links to `/giocatori/modal?mode=create&torneoId=<selectedTorneoId>` when a tournament is selected.
- Player cards link to `/giocatori/modal?mode=view&giocatoreId=<g_id>&torneoId=<selectedTorneoId>`.
- View mode edit button links to `/giocatori/modal?mode=edit&giocatoreId=<id>&torneoId=<selectedTorneoId>`.

## Data Layer Design

Extend `data/giocatori.ts`.

List:
- Keep `getListaGiocatori`, but adapt as needed for filters.
- Inputs:
  - `searchParam: string | null`
  - `idTorneo: number`
  - `currentPage: number`
  - `resultsPerPage: number`
  - optional filters: `idSquadra`, `ruolo`, `soloCapitani`
- Query source: `ricerca_giocatori`.
- Search fields: `g_nome`, `g_cognome`.
- Filter fields:
  - `id_torneo`
  - `s_nome` for team filtering, because `ricerca_giocatori` exposes team display fields but not `s_id`.
  - `g_ruolo_principale`
  - `g_is_capitano`
- Ordering: team name, player name, player surname.
- Keep count support for total result text.
- Keep timeout.

Detail:
- Add a function that fetches player details plus the registration for a specific tournament.
- It should select from `giocatore` for the player record and from `iscrizione` for the row matching `id_giocatore` and `id_torneo`.
- It should return a structured object `{ giocatore, iscrizione }`.

Create:
- Add `insertGiocatore(payload: TablesInsert<'giocatore'>)`.
- Add `insertIscrizione(payload: TablesInsert<'iscrizione'>)`.
- Add a higher-level helper only if it reduces UI complexity; otherwise the modal can orchestrate the two calls.
- The save sequence is:
  1. Insert `giocatore`.
  2. Insert `iscrizione` using the returned player id.
- If `iscrizione` insert fails after player insert, show a meaningful error. No delete rollback is planned because delete is explicitly out of scope and RLS/delete policy is not part of this app flow.

Update:
- Add `updateGiocatore(idGiocatore, payload: TablesUpdate<'giocatore'>)`.
- Add `updateIscrizione(idIscrizione, payload: TablesUpdate<'iscrizione'>)`.
- For edit mode, update player fields and then update the tournament-specific registration.
- If no registration exists for the selected tournament in edit mode, create one only after the user has selected a team and tournament.

Types:
- Every exported function gets a derived type alias, following repo conventions.

## List UI Design

The list should follow the mockup and the existing Tornei implementation style.

Structure:
- Full-screen `View` with `bg-background`.
- Header row:
  - Back-style icon can be omitted if this tab is root, but the visual hierarchy should still match the mockup with large `Lista giocatori` title.
  - Plus button on the right using `lucide-react-native`.
- Search/filter row:
  - Search input placeholder: `Cerca per nome, cognome...`.
  - Filter icon button opens an advanced filter panel/modal.
- Tabs row:
  - `Tutti`
  - `Quest'anno`
  - `Capitani`
  - total count on the right, e.g. `317 risultati totali`.
- List:
  - `FlatList`.
  - Pull-to-refresh.
  - Loading state with spinner and `Caricamento giocatori...`.
  - Empty state with user/group icon and clear text.
  - Bottom padding enough for the tab bar.

Tab behavior:
- `Tutti`: all players in selected tournament.
- `Quest'anno`: selects the newest tournament returned by `getListaTornei(null)` and reloads players for that tournament.
- `Capitani`: filters `g_is_capitano = true`.

Advanced filter behavior:
- Tournament selector is required for loading a list.
- Team selector is populated from `getListaSquadre(null, selectedTorneoId)`.
- Team selector stores both `s_id` and `s_nome` for display, but list filtering uses `s_nome` because the `ricerca_giocatori` view does not expose `s_id`.
- Role selector uses `Enums<'ruolo_giocatore'>`.
- Captain filter is a toggle.
- Applying filters reloads the first page.
- Clearing filters keeps tournament selection if the user explicitly selected one; otherwise it prompts/selects a tournament before querying.

## Card Design

Create `components/giocatori/GiocatoreCard.tsx`.

Props should be derived from `listaGiocatoriType` at the call site, but the component can receive explicit display props:
- `id`
- `nome`
- `cognome`
- `linkFoto`
- `nomeSquadra`
- `acronimoSquadra`
- `coloreSquadra`
- `isCapitano`

Visuals:
- White card with subtle border/shadow, same family as Tornei card.
- Circular avatar:
  - Image when `linkFoto` exists.
  - Team/player initials fallback when missing.
  - Respect dynamic team color, but ensure readable contrast.
- Primary text: full player name.
- Secondary text: icon + team name/acronym.
- Kebab/action icon on the right for visual parity with mockup; tapping the card opens view mode.

## Modal and Wizard Design

Create `components/giocatori/GiocatoreModal.tsx`.

Modes:
- `view`
- `edit`
- `create`

View mode:
- Loads `{ giocatore, iscrizione }`.
- Shows read-only sections:
  - `Dati giocatore`
  - `Dati iscrizione`
- Buttons:
  - `Torna indietro`
  - `Modifica`

Edit mode:
- Same sections as view, editable.
- Can update both player and registration.
- Buttons:
  - `Annulla`
  - `Salva modifiche`

Create mode:
- Two-step wizard:
  1. `Dati giocatore`
  2. `Iscrizione`
- Step 1 fields:
  - `nome` required.
  - `cognome` required.
  - `link_foto`.
  - `nazionalita`.
  - `data_nascita`.
  - `ruolo_principale`.
  - `piede_principale`.
  - `nome_maglia`.
  - `numero_maglia`.
  - `username_ig`.
  - `is_capitano`.
- Step 2 fields:
  - `id_torneo` required.
  - `id_squadra` required.
  - `dettagli`.
- Buttons:
  - Step 1: `Annulla`, `Avanti`.
  - Step 2: `Indietro`, `Crea giocatore`.

Validation:
- `nome` and `cognome` required.
- `id_torneo` and `id_squadra` required before create submit.
- Numeric fields such as `altezza` and `peso`, if included, must parse to numbers or remain `null`.
- Date fields must be converted to ISO strings or `null`.
- Empty optional strings should be saved as `null`.

Error handling:
- Use `errorMessage`.
- Avoid silent failures.
- Disable submit while saving.
- Show loading state while fetching detail/edit data.

## Component Boundaries

Keep files focused:
- `GiocatoreCard`: display-only card.
- `GiocatoreModal`: mode orchestration and high-level form state.
- Small internal render helpers are acceptable inside `GiocatoreModal` while the feature is new.
- If the modal grows too large during implementation, split:
  - `GiocatoreFormSection`
  - `IscrizioneFormSection`
  - `GiocatoreFilterPanel`

Do not edit `components/ui/` primitives unless a true design-system issue blocks the feature.

## Styling Rules

Use the existing project conventions:
- NativeWind for layout/spacing.
- `StyleSheet.create()` for shadows, exact colors, card radii, input radii, and platform-specific values.
- Preserve Inter typography through `InterText` and `fontFamily: 'Inter'` in StyleSheet text styles.
- Use token colors where possible:
  - `bg-background`
  - `text-foreground`
  - `text-muted-foreground`
  - `border-border`
- Use existing hardcoded colors from `AGENTS.md` where StyleSheet exact values are needed.

Mockup fidelity priorities:
- Similar hierarchy and spacing to `lista-giocatori.jpeg`.
- Search/filter/tabs above list.
- Rounded white cards.
- Circular avatars/fallbacks.
- Bottom tab bar remains unobstructed.

## Verification Design

Because no lint/test suite is configured, implementation verification should include:
- `npx tsc --noEmit`.
- Start Expo web with `npm run web`.
- Browser/manual checks:
  - Giocatori tab renders list shell.
  - Tournament filter loads and drives list query.
  - Search reloads list.
  - Tabs switch correctly.
  - Advanced filters apply and clear.
  - Empty and loading states render.
  - Card opens view modal.
  - View modal opens edit modal.
  - Create wizard moves step 1 to step 2.
  - Create validates required fields.
  - Save disables while submitting.
  - UI remains usable on mobile-width viewport.

Commit strategy:
- Commit the design spec separately.
- Commit implementation in small rollback-friendly chunks:
  1. Route scaffolding and data-layer types/functions.
  2. List screen and card.
  3. Filters.
  4. View/edit modal.
  5. Create wizard.
  6. Verification fixes.

## Implementation Notes

- Delete is intentionally excluded even for rollback after partial create; failed registration after player insert should be reported clearly and can be fixed manually/admin-side.
- If two teams in the same tournament share the same `s_nome`, the team filter can match both. This is acceptable for the first iteration because team names should be unique in the same tournament context. A future database view update can expose `s_id` in `ricerca_giocatori` to make this exact.
