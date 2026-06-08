# Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder home tab with a data-driven dashboard for the latest tournament.

**Architecture:** Add Supabase helpers for today's matches and tournament match statistics, then build focused home UI components consumed by `app/(app)/(tabs)/index.tsx`. The home screen owns fetching, refresh state, and error handling; components remain presentational.

**Tech Stack:** Expo Router, React Native, NativeWind, `StyleSheet.create()`, Supabase JS, TypeScript strict mode.

---

## File Structure

- Modify `tests/feature-contracts.ts`: compile-time contract for new home data helpers.
- Modify `data/partite.ts`: add `getPartiteOggi` and `getStatisticheHomeTorneo`.
- Create `components/home/HomeMatchCard.tsx`: today's match card.
- Create `components/home/HomeStatCard.tsx`: statistic tile.
- Create `components/home/HomeQuickAction.tsx`: quick action tile with Expo Router link.
- Modify `app/(app)/(tabs)/index.tsx`: replace placeholder home with dashboard.

## Task 1: Contract Test

**Files:**
- Modify: `tests/feature-contracts.ts`

- [ ] **Step 1: Add failing compile-time contract**

Add these imports and assertions:

```ts
import {
    getPartiteOggi,
    getStatisticheHomeTorneo,
    homeTorneoStatsType,
    partiteOggiType,
} from '@/data/partite';

async function assertHomeContracts() {
    const today: partiteOggiType[] = await getPartiteOggi(1, new Date('2026-06-08T12:00:00'));
    const stats: homeTorneoStatsType = await getStatisticheHomeTorneo(
        1,
        new Date('2026-06-08T12:00:00'),
    );

    const upcoming: number = stats.upcomingMatches;
    const goals: number = stats.goalsScored;

    return { today, upcoming, goals };
}

void assertHomeContracts;
```

- [ ] **Step 2: Verify red**

Run: `npx tsc --noEmit`

Expected: FAIL because `getPartiteOggi`, `getStatisticheHomeTorneo`, `homeTorneoStatsType`, and `partiteOggiType` are not exported yet.

- [ ] **Step 3: Commit**

```bash
git add tests/feature-contracts.ts
git commit -m "test: add home dashboard contracts"
```

## Task 2: Home Data Helpers

**Files:**
- Modify: `data/partite.ts`

- [ ] **Step 1: Add date range helper inside `data/partite.ts`**

Use local-day ISO ranges:

```ts
function getLocalDayRange(now: Date) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return {
        startIso: start.toISOString(),
        endIso: end.toISOString(),
    };
}
```

- [ ] **Step 2: Add `getPartiteOggi`**

```ts
export async function getPartiteOggi(idTorneo: number, now = new Date()) {
    const { startIso, endIso } = getLocalDayRange(now);

    const { data, error } = await supabase
        .from('risultati_partite')
        .select(`*`)
        .eq('torneo_id', idTorneo)
        .gte('fischio_inizio', startIso)
        .lte('fischio_inizio', endIso)
        .order('fischio_inizio', { ascending: true })
        .limit(3)
        .abortSignal(AbortSignal.timeout(20000));

    if (error) throw error;

    return data ?? [];
}

export type partiteOggiType = Awaited<ReturnType<typeof getPartiteOggi>>[number];
```

- [ ] **Step 3: Add `getStatisticheHomeTorneo`**

```ts
export async function getStatisticheHomeTorneo(idTorneo: number, now = new Date()) {
    const { count: upcomingMatches, error: upcomingError } = await supabase
        .from('risultati_partite')
        .select('id_partita', { count: 'exact', head: true })
        .eq('torneo_id', idTorneo)
        .gte('fischio_inizio', now.toISOString())
        .abortSignal(AbortSignal.timeout(20000));

    if (upcomingError) throw upcomingError;

    const { data: goalRows, error: goalError } = await supabase
        .from('risultati_partite')
        .select('goal_casa, goal_ospite')
        .eq('torneo_id', idTorneo)
        .abortSignal(AbortSignal.timeout(20000));

    if (goalError) throw goalError;

    const goalsScored = (goalRows ?? []).reduce((total, match) => {
        return total + (match.goal_casa ?? 0) + (match.goal_ospite ?? 0);
    }, 0);

    return {
        upcomingMatches: upcomingMatches ?? 0,
        goalsScored,
    };
}

export type homeTorneoStatsType = Awaited<ReturnType<typeof getStatisticheHomeTorneo>>;
```

- [ ] **Step 4: Verify green**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add data/partite.ts tests/feature-contracts.ts
git commit -m "feat: add home dashboard data helpers"
```

## Task 3: Home Presentational Components

**Files:**
- Create: `components/home/HomeMatchCard.tsx`
- Create: `components/home/HomeStatCard.tsx`
- Create: `components/home/HomeQuickAction.tsx`

- [ ] **Step 1: Create `HomeMatchCard`**

Props:

```ts
type Props = {
    fase: string | null;
    categoria: string | null;
    girone: string | null;
    fischioInizio: string | null;
    squadraCasa: string | null;
    squadraOspite: string | null;
    goalCasa: number | null;
    goalOspite: number | null;
};
```

Render a white card with match meta, central score or kickoff time, and home/away team names.

- [ ] **Step 2: Create `HomeStatCard`**

Props:

```ts
type Props = {
    label: string;
    value: number;
    tone: 'red' | 'gold' | 'green' | 'blue';
    icon: React.ReactNode;
};
```

Render a 2-column-friendly stat tile matching the mockup hierarchy.

- [ ] **Step 3: Create `HomeQuickAction`**

Props:

```ts
type Props = {
    label: string;
    href: Href;
    icon: React.ReactNode;
};
```

Render a tappable card using `Link` with icon and label.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/home/HomeMatchCard.tsx components/home/HomeStatCard.tsx components/home/HomeQuickAction.tsx
git commit -m "feat: add home dashboard components"
```

## Task 4: Home Screen

**Files:**
- Modify: `app/(app)/(tabs)/index.tsx`

- [ ] **Step 1: Replace placeholder with data-driven screen**

Use:

- `getListaTornei(null)` for latest tournament.
- `getPartiteOggi(latestTorneo.id)`.
- `getStatisticheHomeTorneo(latestTorneo.id)`.
- `getListaSquadre(null, latestTorneo.id)` for squad count.
- `getListaGiocatori('', latestTorneo.id, 1, 1)` for player count.
- `useAuthContext()` for profile/email fallback.

- [ ] **Step 2: Implement layout sections**

Sections:

- Header with welcome, `+`, settings.
- Tournament context line.
- `Partite di oggi`.
- 2-column stats grid.
- Quick actions.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add 'app/(app)/(tabs)/index.tsx'
git commit -m "feat: build data driven home dashboard"
```

## Task 5: Final Verification

**Files:**
- No planned edits.

- [ ] **Step 1: Run TypeScript**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 2: Run Expo web**

Run: `npm run web`

Expected: dev server starts and bundles without fatal errors.

- [ ] **Step 3: Check home route**

Run:

```bash
curl -I --max-time 20 http://localhost:8081/
```

Expected: `HTTP/1.1 200 OK`.

- [ ] **Step 4: Report status**

Report verification results and mention any unrelated dirty worktree entries.
