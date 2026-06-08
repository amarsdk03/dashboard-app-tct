# Home Dashboard Design

## Goal

Replace the placeholder home screen with a data-driven admin dashboard that follows the existing `assets/screen-mockups/home.jpeg` direction: welcome header, today's matches, general statistics, and quick actions.

## Approved Direction

Use approach 2: a home dashboard driven by the most recent tournament.

The home should automatically select the latest tournament returned by `getListaTornei(null)`. This keeps the first screen useful without adding a tournament selector yet. Navigation from the home can still send users to full list screens where tournament filters already exist.

## Current Context

The app is an Expo React Native admin dashboard backed by Supabase. The current home at `app/(app)/(tabs)/index.tsx` is only a placeholder with `Home` and a sign-out button.

Existing implemented screens:

- `tornei`: list and full view/create/edit modal.
- `giocatori`: list, filters, view/edit/create wizard.
- `squadre`: filtered list by tournament.
- `partite`: filtered list by tournament.

Relevant views and data functions:

- `getListaTornei(null)` from `data/tornei.ts`.
- `risultati_partite` through `data/partite.ts`.
- `ricerca_squadre` through `data/squadre.ts`.
- `ricerca_giocatori` through `data/giocatori.ts`.

## Layout

The screen should be a scrollable dashboard using the same visual language as the existing tabs:

1. Header
   - `Bentornato,`
   - admin display name if available, otherwise `Admin`;
   - circular quick-create button;
   - circular settings button linking to `/impostazioni`.

2. Tournament Context
   - compact text showing the selected latest tournament name;
   - this avoids ambiguity for statistics and today's matches.

3. `Partite di oggi`
   - list up to three match cards for matches scheduled today in the selected tournament;
   - card content: phase/category, kickoff or score, home team, away team, group if present;
   - if there are no matches today, show a compact empty state.

4. `Statistiche generali`
   - four stat cards following the mockup structure:
     - upcoming matches;
     - goals scored;
     - registered squads;
     - registered players.

5. `Azioni rapide`
   - navigation cards/buttons for:
     - Tornei;
     - Partite;
     - Squadre;
     - Giocatori.
   - pass `torneoId` to Partite, Squadre, and Giocatori routes.

## Data Behavior

Add these data helpers in `data/partite.ts`:

- `getPartiteOggi(idTorneo: number, now?: Date)`
  - reads `risultati_partite`;
  - filters by `torneo_id`;
  - filters `fischio_inizio` between start and end of the local day;
  - orders by `fischio_inizio` ascending;
  - limits to three rows;
  - uses `.abortSignal(AbortSignal.timeout(20000))`.

- `getStatisticheHomeTorneo(idTorneo: number, now?: Date)`
  - returns counts/sums needed by the home;
  - upcoming matches: `risultati_partite` where `fischio_inizio >= now`;
  - goals scored: sum of non-null `goal_casa + goal_ospite` from tournament matches;
  - match stats use `risultati_partite`;
  - squad/player counts can be loaded by the screen using existing `getListaSquadre` and `getListaGiocatori('', idTorneo, 1, 1)`.

If no tournament exists, the home should render empty states and quick actions without crashing.

## Components

Create focused components instead of putting all UI into `index.tsx`:

- `components/home/HomeMatchCard.tsx`
  - compact card for today's matches.

- `components/home/HomeStatCard.tsx`
  - reusable statistic tile.

- `components/home/HomeQuickAction.tsx`
  - quick action tile linking to a route.

The main screen owns loading, refreshing, data fetching, and error handling.

## Styling

Follow project conventions from `AGENTS.md`:

- Use `InterText` for text.
- Use NativeWind for simple layout wrappers.
- Use `StyleSheet.create()` for cards, shadows, exact spacing, and colors.
- Keep colors aligned with existing tokens and hardcoded values:
  - page background `#f8fafc`;
  - card background `#ffffff`;
  - primary `#0f172a`;
  - muted text `#64748b`;
  - border `#e2e8f0`.

The mockup has decorative background texture. In this implementation, use the existing clean dashboard background and do not add a heavy image background.

## Error Handling

Use `errorMessage(title, error)` for failed fetches. The home should keep partial sections usable where possible:

- if today's matches fail, show empty state for that section;
- if stats fail, show zero values;
- if tournament load fails, show quick actions and an error alert.

## Verification

There is no configured test suite or lint command. Verification should use:

- `npx tsc --noEmit`;
- Expo web route check for `/`.

Manual checks:

- Home renders with no tournament data.
- Home renders with a latest tournament.
- Quick actions navigate to existing tabs.
- Text does not overflow on mobile-width layout.

## Out Of Scope

- Tournament selector on the home.
- Match detail modal.
- Creating records from the `+` button beyond linking to existing create routes/menu.
- New database views.
- Push notifications.
