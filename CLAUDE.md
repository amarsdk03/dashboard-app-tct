# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Admin dashboard mobile app (iOS, Android, Web) for the "Torneo Città di Trento" amateur football tournament. Built as an Expo React Native app backed by Supabase. Only authenticated admins can INSERT/UPDATE data; all data is publicly SELECTable via Supabase Row Level Security.

## Commands

```bash
npm run dev        # expo start -c (clears cache)
npm run android    # expo start -c --android
npm run ios        # expo start -c --ios
npm run web        # expo start -c --web
npm run clean      # rm -rf .expo node_modules
eas build          # production build via EAS
```

No linting or test suite is configured.

## Required environment variables

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Architecture

### Routing (Expo Router file-based)

```
app/_layout.tsx              # Root: loads Inter fonts, wraps AuthProvider, Stack.Protected auth gates
app/login.tsx                # Unauthenticated login screen
app/(app)/_layout.tsx        # Authenticated Stack shell
app/(app)/(tabs)/_layout.tsx # Tab bar: tornei | partite | index (logo) | squadre | giocatori
app/(app)/(tabs)/index.tsx   # Home tab
app/(app)/(tabs)/tornei/     # Nested Stack for Tornei tab
  _layout.tsx                #   Stack with modal screen registered
  index.tsx                  #   List screen
  modal.tsx                  #   Route that bridges URL params → TorneoModalForm component
```

The modal pattern for every entity: a `modal.tsx` route receives `?mode=create|view|edit&<entity>Id=<n>` search params via `useLocalSearchParams`, then renders the shared `<EntityModal>` component. Navigate to modals with `<Link href="/tornei/modal?mode=create">`.

### Auth flow

`AuthProvider` (`providers/auth-provider.tsx`) holds `isLoggedIn`, `claims`, `profile`, `isLoading`. It calls `supabase.auth.getSession()` on mount and subscribes to `onAuthStateChange`. Route protection is handled in `app/_layout.tsx` with Expo Router's `<Stack.Protected guard={...}>`. Consume auth state anywhere via `useAuthContext()` from `hooks/use-auth-context.tsx`.

### Data layer (`data/`)

Each file exports async functions that call Supabase directly. The pattern is uniform:

```ts
export async function getListaTornei(searchParam: string | null) {
    let query = supabase.from('torneo').select(`id, nome, ...`);
    if (searchParam) query = query.ilike('nome', `%${searchParam}%`);
    query = query.order(...).abortSignal(AbortSignal.timeout(20000));
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

// Export the row type derived from the function's return — never declare manually
export type listaTorneiType = Awaited<ReturnType<typeof getListaTornei>>[number];
```

Rules:
- Always add `.abortSignal(AbortSignal.timeout(20000))` on list queries.
- Always `throw error` on Supabase errors (let the caller `Alert.alert`).
- Use Supabase Views (`risultati_partite`, `ricerca_giocatori`, `ricerca_squadre`, `lista_categorie`, `azioni_giocatori`, `azioni_partite`) for joined reads instead of joining in code.
- Export a `*Type` alias derived from the function return for every data function.

### Database types

All types come from `types/database.types.ts` (Supabase-generated). Never redefine table shapes manually. Use the provided helpers:

```ts
import { Tables, TablesInsert, TablesUpdate, Enums } from '@/types/database.types';

type Torneo = Tables<'torneo'>;
type NuovoTorneo = TablesInsert<'torneo'>;
type TorneoUpdate = TablesUpdate<'torneo'>;
type Ruolo = Enums<'ruolo_giocatore'>; // 'Tecnico' | 'Portiere' | 'Difensore' | 'Centrocampista' | 'Attaccante'
```

### Supabase client (platform split)

Metro resolves `lib/supabase.ts` on native (uses `expo-secure-store`) and `lib/supabase.web.ts` on web (uses `AsyncStorage`). Always import from `@/lib/supabase` — Metro handles the split automatically.

## Styling conventions

The app uses **NativeWind (Tailwind)** for layout/spacing and **`StyleSheet.create()`** for anything requiring shadow, complex layout, or precise values. Both are used together on the same component.

### Token colors (CSS custom properties in `global.css`)

Tailwind semantic classes (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, etc.) resolve to HSL variables defined in `global.css`. Use these in NativeWind classNames.

### Hardcoded colors used in `StyleSheet.create()`

| Purpose | Value |
|---|---|
| Primary button background | `#0f172a` |
| Primary button text | `#ffffff` |
| Tab bar active tint | `#b3642c` |
| Card / form card background | `#ffffff` |
| Page background | `#f8fafc` |
| Card border | `#f1f5f9` |
| Input background | `#f8fafc` |
| Input border | `#e2e8f0` |
| Input text | `#0f172a` |
| Placeholder text | `#94a3b8` |
| Label text | `#111111` |
| Destructive button background | `#d9a3a3` |
| Destructive button text | `#7c3f3f` |
| Login page background | `#8e8171` |
| Login button | `#b98e6b` |

### Shadow style (cards and buttons)

```ts
// Cards (subtle)
shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2

// Buttons (more visible)
shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3
```

### Border radii

- Cards / form cards: `borderRadius: 16`
- Buttons: `borderRadius: 12`
- Inputs: `borderRadius: 10`
- Tab bar: `borderRadius: 50`
- Login inputs/buttons: `borderRadius: 20` / `16`

### Typography

- Use `<InterText>` (`components/InterText.tsx`) for all native `<Text>` that needs the Inter font.
- Use `<Text>` from `@/components/ui/text` for elements that need theme-aware color.
- In `StyleSheet`, always set `fontFamily: 'Inter'` explicitly (don't rely on system default).
- Available font weights loaded: `Inter` (400), `Inter-Medium` (500), `Inter-SemiBold` (600), `Inter-Bold` (700).

## Component conventions

### `components/ui/`

Base primitive components from **React Native Reusables** (wrapping `@rn-primitives/*`), styled with NativeWind and `class-variance-authority`. Use `cn()` from `@/lib/utils` for conditional class merging. These components support `variant` and `size` props (CVA pattern). Do not edit these unless updating the design system.

### `components/input/`

Form-level wrappers around native inputs with a consistent label+input layout:
- `TextInputField` — text / multiline textarea
- `DateTimePickerField` — date/time picker with platform split (HTML `<input type="date">` on web, `@expo/ui` picker on native, lazy-loaded via `require()` inside an `if (Platform.OS !== 'web')` guard).

### Domain components (`components/tornei/`, etc.)

Entity-specific UI. Modals are full-screen animated sheets using `Animated.Value` for slide-in (spring) and slide-out (timing). Each modal accepts `mode: 'view' | 'create' | 'edit'` and an optional entity ID.

## Platform guards

- Use `Platform.OS !== 'web'` / `Platform.OS === 'web'` for behavior that differs (pickers, keyboard avoiding, tab bar padding).
- Lazy-load native-only packages with `require()` inside a `Platform.OS !== 'web'` guard — never import them at module top level or they break the web bundle.
- `KeyboardAvoidingView` behavior: `'padding'` on iOS, `'height'` on Android/web.

## Path aliases

`@/` resolves to the project root. Always use `@/` imports, never relative `../../`, unless you need to define a href for a link.
