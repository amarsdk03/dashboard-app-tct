# Torneo Linked Data And Nationality Autocomplete Design

## Goal

Add a practical way to move from a tournament detail screen to the squads, players, and matches that belong to that tournament, and replace the always-visible nationality hint chips in the player form with a compact autocomplete input with flags.

## Current Context

The app is an Expo React Native dashboard using Expo Router tabs and Supabase. `tornei` and `giocatori` already use the established `index.tsx` plus `modal.tsx` pattern. `squadre` and `partite` currently have placeholder tab screens, but their data functions already exist:

- `data/squadre.ts` reads tournament squads from `ricerca_squadre`.
- `data/giocatori.ts` reads tournament players from `ricerca_giocatori`.
- `data/partite.ts` reads tournament matches from `risultati_partite`.

The work should stay consistent with the implemented Tornei and Giocatori screens: NativeWind for layout, `StyleSheet.create()` for precise UI, `InterText` for typography, `@/` imports, and Supabase data functions that throw errors.

## Approved Direction

Use the hybrid approach:

- In tournament view mode, add a compact `Dati collegati` section.
- Show three counters: squads, players, matches.
- Show three actions: `Vedi squadre`, `Vedi giocatori`, `Vedi partite`.
- The actions navigate to the dedicated tab screens with the tournament already selected.
- Full lists stay in their own screens rather than being embedded inside the tournament modal.

This keeps the tournament modal light while making the relationship between tournament, squads, players, and matches obvious.

## Tournament Detail Behavior

`components/tornei/TorneoModalForm.tsx` will load linked-data summary only in `view` mode and only when `torneoId` exists.

The summary should contain:

- squad count from `getListaSquadre(null, torneoId)`;
- player count from `getListaGiocatori('', torneoId, 1, 1)`, using the returned `count`;
- match count from a new or adjusted match query that can count `risultati_partite` by `torneo_id`.

Failure to load the summary should not block the tournament detail form. It should show an alert through the existing `errorMessage` helper and render safe fallback values, such as `0`.

The section appears after the existing tournament fields and before the footer buttons. It should be hidden in `create` and `edit` mode to avoid mixing edit controls and navigation shortcuts.

## Navigation And Filtering

The linked actions should use Expo Router links with query params:

- `/squadre?torneoId=<id>`
- `/giocatori?torneoId=<id>`
- `/partite?torneoId=<id>`

`GiocatoriScreen` should read `torneoId` from `useLocalSearchParams` and initialize or update `selectedTorneo` accordingly. Its current filter behavior remains intact.

`SquadreScreen` should become a real list screen with tournament filtering. It can be simpler than Giocatori for now: header, tournament chips/filter, list cards or rows, loading/empty states.

`PartiteScreen` should become a real list screen with tournament filtering. It can start with a simple tournament selector and match rows using `risultati_partite` fields already returned by `getListaPartite`.

The implementation should avoid building detailed squad or match modals in this pass. The goal is tournament-context navigation and readable filtered lists.

## Nationality Autocomplete

Replace `NAZIONI_HINT` and `HintSection` in `components/giocatori/GiocatoreModal.tsx` with a reusable nationality autocomplete component.

Expected behavior:

- The form still stores a plain string in `giocatore.nazionalita`.
- While typing or focusing the field, show a small suggestion panel below the input.
- Suggestions include country name, ISO-like code, and flag emoji.
- Selecting a suggestion sets the nationality name, for example `Italia`.
- The selected flag can appear inside the input area when there is an exact match.
- In readonly mode, render only the stored value and the flag if the value matches a known country.
- If the user types a country not present in the list, keep the typed value; do not force a closed enum.

The country list should be local and deterministic. It should include the most likely tournament nationalities first, then common countries:

`Italia`, `Albania`, `Marocco`, `Tunisia`, `Romania`, `Moldavia`, `Ucraina`, `Brasile`, `Argentina`, `Francia`, `Germania`, `Spagna`, `Senegal`, `Ghana`, `Nigeria`, plus enough European/common countries to make the autocomplete feel complete.

## Components

Create focused components instead of adding too much responsibility to existing screens:

- `components/input/NationalitySelectField.text`
  - form-level field with label, input, suggestions, readonly state;
  - uses `TextInput`, `TouchableOpacity`, `View`, `StyleSheet`, and `InterText`;
  - follows existing input colors and radii.

- `components/tornei/TorneoLinkedData.tsx`
  - visual section for counters and navigation actions;
  - receives counts, loading state, and `torneoId`;
  - does not fetch data directly; `TorneoModalForm` owns loading and error handling.

- `components/squadre/SquadraCard.tsx`
  - compact card for squad list rows.

- `components/partite/PartitaCard.tsx`
  - compact card for match list rows.

## Data Layer

Add small data helpers where needed:

- `getConteggioPartiteTorneo(idTorneo: number)` in `data/partite.ts`, using `risultati_partite.select('id_partita', { count: 'exact', head: true }).eq('torneo_id', idTorneo)`.
- Reuse `getListaSquadre(null, idTorneo)` for squad count because the function already dedupes view duplicates.
- Reuse `getListaGiocatori('', idTorneo, 1, 1)` for player count because it already exposes `count`.

List queries that are expected to return multiple rows should include `.abortSignal(AbortSignal.timeout(20000))`, matching repository conventions.

## Error Handling

Use existing `errorMessage(title, error)` in screens/modals. Keep the modal usable if summary counts fail. Keep list screens usable with empty states if a selected tournament has no related data.

## Verification

There is no configured test suite or lint command. Verification should use:

- `npx tsc --noEmit`;
- Expo web route checks using the first tournament ID returned by `getListaTornei(null)`:
  - `/tornei/modal?mode=view&torneoId=<id>`;
  - `/giocatori?torneoId=<id>`;
  - `/squadre?torneoId=<id>`;
  - `/partite?torneoId=<id>`.

If the database returns no tournaments, verify that the tab routes compile and empty states render without crashes.

## Out Of Scope

- Creating squad modals.
- Creating match modals.
- Uploading nationality flags as image assets.
- Changing the database schema.
- Making nationality a database enum.
