# Giocatori Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Giocatori admin flow: list, filters, detail/edit modal, and two-step create wizard that inserts both `giocatore` and `iscrizione`.

**Architecture:** Follow the existing Tornei pattern: nested Expo Router stack, a `modal.tsx` route bridge, `data/giocatori.ts` Supabase functions, and domain components under `components/giocatori/`. Keep database types derived from `types/database.types.ts`, keep UI style consistent with Tornei and the Giocatori mockup, and commit each rollback-friendly slice separately.

**Tech Stack:** Expo Router, React Native, NativeWind, StyleSheet, Supabase JS, TypeScript strict mode, React Native Reusables primitives where useful.

---

## Files

- Modify: `data/giocatori.ts`
- Create: `app/(app)/(tabs)/giocatori/_layout.tsx`
- Modify: `app/(app)/(tabs)/giocatori/index.tsx`
- Create: `app/(app)/(tabs)/giocatori/modal.tsx`
- Create: `components/giocatori/GiocatoreCard.tsx`
- Create: `components/giocatori/GiocatoreModal.tsx`

Reference only:
- `components/tornei/TorneoCard.tsx`
- `components/tornei/TorneoModalForm.tsx`
- `app/(app)/(tabs)/tornei/index.tsx`
- `app/(app)/(tabs)/tornei/modal.tsx`
- `data/tornei.ts`
- `data/squadre.ts`
- `types/database.types.ts`

## Task 1: Data Layer

**Files:**
- Modify: `data/giocatori.ts`

- [ ] **Step 1: Replace manual-only data types with database helper imports**

Add imports:

```ts
import { supabase } from '@/lib/supabase';
import { Enums, TablesInsert, TablesUpdate } from '@/types/database.types';
```

Define filter type:

```ts
export type filtroGiocatoriType = {
    idSquadra?: number | null;
    nomeSquadra?: string | null;
    ruolo?: Enums<'ruolo_giocatore'> | null;
    soloCapitani?: boolean;
};
```

- [ ] **Step 2: Extend `getListaGiocatori`**

Update signature:

```ts
export async function getListaGiocatori(
    searchParam: string | null,
    idTorneo: number,
    currentPage: number,
    resultsPerPage: number,
    filters: filtroGiocatoriType = {},
)
```

Behavior:
- Select `*` from `ricerca_giocatori` with exact count.
- Filter by `id_torneo`.
- Search `g_nome` and `g_cognome`.
- Filter `s_nome` by `filters.nomeSquadra` because the view does not expose `s_id`.
- Filter `g_ruolo_principale` by `filters.ruolo`.
- Filter `g_is_capitano` when `filters.soloCapitani` is true.
- Order by `s_nome`, `g_nome`, `g_cognome`.
- Range by page.
- Add `.abortSignal(AbortSignal.timeout(20000))`.
- Throw errors.
- Return `{ result, count }`.

- [ ] **Step 3: Add detail function**

Add:

```ts
export async function getDatiGiocatoreConIscrizione(idGiocatore: number, idTorneo: number) {
    const { data: giocatore, error: giocatoreError } = await supabase
        .from('giocatore')
        .select(`*`)
        .eq('id', idGiocatore)
        .maybeSingle();

    if (giocatoreError) throw giocatoreError;

    const { data: iscrizione, error: iscrizioneError } = await supabase
        .from('iscrizione')
        .select(`*`)
        .eq('id_giocatore', idGiocatore)
        .eq('id_torneo', idTorneo)
        .maybeSingle();

    if (iscrizioneError) throw iscrizioneError;

    return { giocatore, iscrizione };
}

export type datiGiocatoreConIscrizioneType = Awaited<
    ReturnType<typeof getDatiGiocatoreConIscrizione>
>;
```

- [ ] **Step 4: Add insert/update functions**

Add:

```ts
export async function insertGiocatore(payload: TablesInsert<'giocatore'>) {
    const { data, error } = await supabase
        .from('giocatore')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export type insertGiocatorePayload = Parameters<typeof insertGiocatore>[0];

export async function updateGiocatore(
    idGiocatore: number,
    payload: TablesUpdate<'giocatore'>,
) {
    const { data, error } = await supabase
        .from('giocatore')
        .update({ ...payload, data_ultima_modifica: new Date().toISOString() })
        .eq('id', idGiocatore)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export type updateGiocatorePayload = Parameters<typeof updateGiocatore>[1];

export async function insertIscrizione(payload: TablesInsert<'iscrizione'>) {
    const { data, error } = await supabase
        .from('iscrizione')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export type insertIscrizionePayload = Parameters<typeof insertIscrizione>[0];

export async function updateIscrizione(
    idIscrizione: number,
    payload: TablesUpdate<'iscrizione'>,
) {
    const { data, error } = await supabase
        .from('iscrizione')
        .update({ ...payload, data_ultima_modifica: new Date().toISOString() })
        .eq('id', idIscrizione)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export type updateIscrizionePayload = Parameters<typeof updateIscrizione>[1];
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
npx tsc --noEmit
```

Expected: exit 0.

Commit:

```bash
git add data/giocatori.ts
git commit -m "feat: add giocatori data functions"
```

## Task 2: Routes and Card

**Files:**
- Create: `app/(app)/(tabs)/giocatori/_layout.tsx`
- Create: `app/(app)/(tabs)/giocatori/modal.tsx`
- Create: `components/giocatori/GiocatoreCard.tsx`
- Modify: `app/(app)/(tabs)/giocatori/index.tsx`

- [ ] **Step 1: Add nested Giocatori stack**

Create `_layout.tsx` matching Tornei:

```ts
import { Stack } from 'expo-router';

export default function Layout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
                name="modal"
                options={{
                    presentation: 'modal',
                    headerShown: false,
                }}
            />
        </Stack>
    );
}
```

- [ ] **Step 2: Add modal route bridge**

Create `modal.tsx` with params `mode`, `giocatoreId`, and `torneoId`, parse numeric ids, and render `GiocatoreModal`.

- [ ] **Step 3: Add `GiocatoreCard`**

Create a card component with props:

```ts
type Props = {
    id: number | string;
    nome: string | null;
    cognome: string | null;
    linkFoto?: string | null;
    nomeSquadra?: string | null;
    acronimoSquadra?: string | null;
    coloreSquadra?: string | null;
    isCapitano?: boolean | null;
};
```

Implement:
- circular image/fallback initials.
- full name.
- team row with `UsersRound`.
- right `MoreVertical`.
- styles matching Tornei card family.

- [ ] **Step 4: Replace placeholder list shell**

Implement initial `index.tsx` with:
- state for tournaments, selected tournament, players, count, loading, refreshing.
- load tournaments using `getListaTornei(null)`.
- select newest tournament by default only for initial usable state; advanced filter still lets user change it.
- load players with `getListaGiocatori`.
- render header, search input, tab row, count, `FlatList`, and cards.
- link create and view modal routes.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npx tsc --noEmit
```

Expected: exit 0.

Commit:

```bash
git add app/'(app)'/'(tabs)'/giocatori components/giocatori/GiocatoreCard.tsx
git commit -m "feat: add giocatori list shell"
```

## Task 3: Filters

**Files:**
- Modify: `app/(app)/(tabs)/giocatori/index.tsx`

- [ ] **Step 1: Add filter state**

Add:
- `search`
- `activeTab: 'tutti' | 'questanno' | 'capitani'`
- `filterOpen`
- selected tournament
- selected team
- selected role
- captain toggle
- teams list loaded from `getListaSquadre(null, selectedTorneo.id)`.

- [ ] **Step 2: Add advanced filter panel**

Use a compact in-screen panel under search when `filterOpen` is true.
Controls:
- tournament option buttons.
- team option buttons.
- role option buttons from enum constant.
- captain toggle.
- `Applica` and `Reset`.

- [ ] **Step 3: Wire tab behavior**

Implement:
- `Tutti`: clears captain-only state.
- `Quest'anno`: selects first tournament from `getListaTornei(null)`.
- `Capitani`: applies captain-only filter.

- [ ] **Step 4: Verify and commit**

Run:

```bash
npx tsc --noEmit
```

Expected: exit 0.

Commit:

```bash
git add app/'(app)'/'(tabs)'/giocatori/index.tsx
git commit -m "feat: add giocatori filters"
```

## Task 4: Modal View/Edit

**Files:**
- Create: `components/giocatori/GiocatoreModal.tsx`

- [ ] **Step 1: Build modal props and form state**

Define:

```ts
export type GiocatoreModalMode = 'view' | 'create' | 'edit';
```

Form state includes player fields and registration fields.

- [ ] **Step 2: Load view/edit data**

For non-create mode:
- require `giocatoreId`.
- use `getDatiGiocatoreConIscrizione`.
- load teams for selected tournament if available.
- map database rows to form state.

- [ ] **Step 3: Render view/edit form**

Use existing `TextInputField` and `DateTimePickerField`.
Use simple pressable selectors for enum/team choices.
Readonly fields in view mode.

Sections:
- `Dati giocatore`.
- `Dati iscrizione`.

Buttons:
- view: `Torna indietro`, `Modifica`.
- edit: `Annulla`, `Salva modifiche`.

- [ ] **Step 4: Implement edit submit**

Validate:
- required `nome`, `cognome`.
- required `id_torneo`, `id_squadra`.

Submit:
- `updateGiocatore`.
- `updateIscrizione` when an existing registration id exists.
- `insertIscrizione` when no registration exists and both tournament/team are selected.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npx tsc --noEmit
```

Expected: exit 0.

Commit:

```bash
git add app/'(app)'/'(tabs)'/giocatori/modal.tsx components/giocatori/GiocatoreModal.tsx
git commit -m "feat: add giocatori view edit modal"
```

## Task 5: Create Wizard

**Files:**
- Modify: `components/giocatori/GiocatoreModal.tsx`

- [ ] **Step 1: Add create step UI**

Create mode renders:
- step indicator.
- step 1: player fields.
- step 2: tournament/team/registration fields.

- [ ] **Step 2: Add create validation**

Step 1 requires:
- `nome`
- `cognome`

Step 2 requires:
- tournament
- team

- [ ] **Step 3: Add create submit**

Create flow:
- build `TablesInsert<'giocatore'>` payload.
- `insertGiocatore`.
- build `TablesInsert<'iscrizione'>` with returned id.
- `insertIscrizione`.
- close modal on success.

- [ ] **Step 4: Verify and commit**

Run:

```bash
npx tsc --noEmit
```

Expected: exit 0.

Commit:

```bash
git add components/giocatori/GiocatoreModal.tsx
git commit -m "feat: add giocatori create wizard"
```

## Task 6: Runtime Verification and Polish

**Files:**
- Modify only files touched by previous Giocatori tasks if verification finds issues:
  - `data/giocatori.ts`
  - `app/(app)/(tabs)/giocatori/_layout.tsx`
  - `app/(app)/(tabs)/giocatori/index.tsx`
  - `app/(app)/(tabs)/giocatori/modal.tsx`
  - `components/giocatori/GiocatoreCard.tsx`
  - `components/giocatori/GiocatoreModal.tsx`

- [ ] **Step 1: Run typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 2: Start Expo web**

Run:

```bash
npm run web
```

Expected: Expo starts without bundling errors.

- [ ] **Step 3: Browser QA**

Check:
- Giocatori tab opens.
- List shows loading, empty, or player rows without crash.
- Search text changes trigger reload.
- Filter panel opens and applies tournament/team/role/captain.
- Tabs `Tutti`, `Quest'anno`, `Capitani` work.
- Card opens view modal.
- View modal links to edit.
- Create wizard validates required fields and navigates steps.
- Layout fits mobile width and bottom tab does not cover primary controls.

- [ ] **Step 4: Commit verification fixes**

If fixes were needed:

```bash
git add data/giocatori.ts app/'(app)'/'(tabs)'/giocatori components/giocatori
git commit -m "fix: polish giocatori flow"
```

If no fixes were needed, do not create an empty commit.
