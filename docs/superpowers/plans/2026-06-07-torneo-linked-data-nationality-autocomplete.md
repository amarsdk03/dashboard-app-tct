# Torneo Linked Data And Nationality Autocomplete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add linked squad/player/match access from tournament details and replace nationality hint chips with a flag autocomplete.

**Architecture:** Add small focused components for the tournament summary, nationality autocomplete, squad cards, and match cards. Reuse existing Supabase view data functions and Expo Router query params so tournament context moves between tabs without changing the database schema.

**Tech Stack:** Expo Router, React Native, NativeWind, `StyleSheet.create()`, Supabase JS, TypeScript strict mode.

---

## File Structure

- Create `tests/feature-contracts.ts`: compile-time contract for planned exports and route-facing helper APIs.
- Create `constants/nationalities.ts`: deterministic country list and pure helpers for matching/filtering nationalities.
- Create `components/input/NationalityAutocompleteField.tsx`: field UI for nationality suggestions.
- Modify `components/giocatori/GiocatoreModal.tsx`: remove visible hint chips and use the autocomplete field.
- Modify `data/partite.ts`: add match count helper and abort signals on list queries.
- Create `components/tornei/TorneoLinkedData.tsx`: count cards plus navigation actions.
- Modify `components/tornei/TorneoModalForm.tsx`: load linked summary in view mode and render the summary component.
- Modify `app/(app)/(tabs)/giocatori/index.tsx`: read `torneoId` query param and initialize selected tournament.
- Create `components/squadre/SquadraCard.tsx`: compact squad row card.
- Modify `app/(app)/(tabs)/squadre/index.tsx`: real filtered squad list.
- Create `components/partite/PartitaCard.tsx`: compact match row card.
- Modify `app/(app)/(tabs)/partite/index.tsx`: real filtered match list.

## Task 1: Contract Test

**Files:**
- Create: `tests/feature-contracts.ts`

- [ ] **Step 1: Add compile-time contract before implementation**

```ts
import {
    filterNationalities,
    findNationality,
    getNationalityFlag,
    NATIONALITIES,
} from '@/constants/nationalities';
import { getConteggioPartiteTorneo } from '@/data/partite';

const filtered = filterNationalities('ita');
const firstName: string | undefined = filtered[0]?.name;
const exactFlag: string | null = getNationalityFlag('Italia');
const exactCountry = findNationality('Italia');
const listLength: number = NATIONALITIES.length;

async function assertMatchCount() {
    const count: number = await getConteggioPartiteTorneo(1);
    return count;
}

void firstName;
void exactFlag;
void exactCountry;
void listLength;
void assertMatchCount;
```

- [ ] **Step 2: Verify red**

Run: `npx tsc --noEmit`

Expected: FAIL because `@/constants/nationalities` and `getConteggioPartiteTorneo` do not exist yet.

- [ ] **Step 3: Commit**

```bash
git add tests/feature-contracts.ts
git commit -m "test: add linked data feature contracts"
```

## Task 2: Nationality Helpers

**Files:**
- Create: `constants/nationalities.ts`

- [ ] **Step 1: Implement helper exports**

Create a country list with `{ name, code, flag }`, sorted with likely tournament countries first. Export:

```ts
export type NationalityOption = {
    name: string;
    code: string;
    flag: string;
};

export const NATIONALITIES: NationalityOption[] = [
    { name: 'Italia', code: 'IT', flag: '🇮🇹' },
    { name: 'Albania', code: 'AL', flag: '🇦🇱' },
    { name: 'Marocco', code: 'MA', flag: '🇲🇦' },
];
export function normalizeNationality(value: string): string;
export function findNationality(value: string | null | undefined): NationalityOption | null;
export function filterNationalities(query: string, limit = 6): NationalityOption[];
export function getNationalityFlag(value: string | null | undefined): string | null;
```

- [ ] **Step 2: Verify partial green**

Run: `npx tsc --noEmit`

Expected: still FAIL only for missing `getConteggioPartiteTorneo`.

- [ ] **Step 3: Commit**

```bash
git add constants/nationalities.ts
git commit -m "feat: add nationality helpers"
```

## Task 3: Match Count Data Helper

**Files:**
- Modify: `data/partite.ts`

- [ ] **Step 1: Add `getConteggioPartiteTorneo`**

Use:

```ts
export async function getConteggioPartiteTorneo(idTorneo: number) {
    const { count, error } = await supabase
        .from('risultati_partite')
        .select('id_partita', { count: 'exact', head: true })
        .eq('torneo_id', idTorneo)
        .abortSignal(AbortSignal.timeout(20000));

    if (error) throw error;
    return count ?? 0;
}
```

- [ ] **Step 2: Add abort signals to multi-row match queries touched during this task**

Ensure `getListaPartite`, `getListaCategorie`, and `getProssimiIncontri` include `.abortSignal(AbortSignal.timeout(20000))`.

- [ ] **Step 3: Verify green**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add data/partite.ts tests/feature-contracts.ts
git commit -m "feat: add partite torneo count"
```

## Task 4: Nationality Autocomplete UI

**Files:**
- Create: `components/input/NationalityAutocompleteField.tsx`
- Modify: `components/giocatori/GiocatoreModal.tsx`

- [ ] **Step 1: Create autocomplete field**

The component accepts:

```ts
type Props = {
    label: string;
    readonly?: boolean;
    value: string | null;
    onChange: (value: string) => void;
    placeholder?: string;
};
```

It renders a label, text input, exact-match flag, and a suggestion panel while focused with non-empty filtered results.

- [ ] **Step 2: Replace visible hint chips in player modal**

Remove `NAZIONI_HINT`, remove `HintSection`, import `NationalityAutocompleteField`, and replace the `TextInputField` plus `HintSection` with:

```tsx
<NationalityAutocompleteField
    label="Nazionalità"
    readonly={readonly}
    value={form.nazionalita}
    onChange={(value) => setField('nazionalita', value)}
    placeholder="Italia"
/>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/input/NationalityAutocompleteField.tsx components/giocatori/GiocatoreModal.tsx
git commit -m "feat: add nationality autocomplete field"
```

## Task 5: Tournament Linked Data Summary

**Files:**
- Create: `components/tornei/TorneoLinkedData.tsx`
- Modify: `components/tornei/TorneoModalForm.tsx`

- [ ] **Step 1: Create summary component**

Props:

```ts
type Props = {
    torneoId: number;
    loading: boolean;
    squadreCount: number;
    giocatoriCount: number;
    partiteCount: number;
};
```

Render three count tiles and three `Link` actions using the current tournament id:

```tsx
<Link href={`/squadre?torneoId=${torneoId}` as Href} asChild>
    <TouchableOpacity>
        <InterText>Vedi squadre</InterText>
    </TouchableOpacity>
</Link>
<Link href={`/giocatori?torneoId=${torneoId}` as Href} asChild>
    <TouchableOpacity>
        <InterText>Vedi giocatori</InterText>
    </TouchableOpacity>
</Link>
<Link href={`/partite?torneoId=${torneoId}` as Href} asChild>
    <TouchableOpacity>
        <InterText>Vedi partite</InterText>
    </TouchableOpacity>
</Link>
```

- [ ] **Step 2: Load summary in `TorneoModalForm`**

In view mode, use `getListaSquadre(null, torneoId)`, `getListaGiocatori('', torneoId, 1, 1)`, and `getConteggioPartiteTorneo(torneoId)`. Keep failures non-blocking with `errorMessage`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/tornei/TorneoLinkedData.tsx components/tornei/TorneoModalForm.tsx
git commit -m "feat: add torneo linked data summary"
```

## Task 6: Giocatori Query Param Filtering

**Files:**
- Modify: `app/(app)/(tabs)/giocatori/index.tsx`

- [ ] **Step 1: Read route params**

Import `useLocalSearchParams` from `expo-router` and read `torneoId?: string`.

- [ ] **Step 2: Select matching tournament after load**

When tournaments load, if `torneoId` is a valid number and exists in the list, set it as `selectedTorneo`; otherwise keep current first-tournament fallback.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add 'app/(app)/(tabs)/giocatori/index.tsx'
git commit -m "feat: support torneo param on giocatori"
```

## Task 7: Squadre List Screen

**Files:**
- Create: `components/squadre/SquadraCard.tsx`
- Modify: `app/(app)/(tabs)/squadre/index.tsx`

- [ ] **Step 1: Create squad card**

Render shield image fallback, squad name, acronym, and captain text if available from `ricerca_squadre` row fields.

- [ ] **Step 2: Build list screen**

Use `getListaTornei(null)` and `getListaSquadre(null, selectedTorneo.id)`, read `torneoId` from query params, render header, tournament chips, loading state, empty state, and `FlatList`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/squadre/SquadraCard.tsx 'app/(app)/(tabs)/squadre/index.tsx'
git commit -m "feat: add squadre filtered list"
```

## Task 8: Partite List Screen

**Files:**
- Create: `components/partite/PartitaCard.tsx`
- Modify: `app/(app)/(tabs)/partite/index.tsx`

- [ ] **Step 1: Create match card**

Render kickoff date/time, phase/category/girone, home/away names, score when available, and status text for scheduled matches.

- [ ] **Step 2: Build list screen**

Use `getListaTornei(null)` and `getListaPartite(selectedTorneo.id, null, null)`, read `torneoId` from query params, render header, tournament chips, loading state, empty state, and `FlatList`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/partite/PartitaCard.tsx 'app/(app)/(tabs)/partite/index.tsx'
git commit -m "feat: add partite filtered list"
```

## Task 9: Final Verification

**Files:**
- No planned edits.

- [ ] **Step 1: Run TypeScript**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 2: Run Expo web**

Run: `npm run web`

Expected: dev server starts without fatal bundling errors.

- [ ] **Step 3: Check routes**

Use the first available tournament ID when possible:

```bash
curl -I --max-time 20 http://localhost:8081/giocatori?torneoId=1
curl -I --max-time 20 http://localhost:8081/squadre?torneoId=1
curl -I --max-time 20 http://localhost:8081/partite?torneoId=1
```

Expected: each route returns `HTTP/1.1 200 OK` or Expo serves the route without a fatal error.

- [ ] **Step 4: Report residual status**

Report verification results and mention the pre-existing `D .env.example` if still present.
