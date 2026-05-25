# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # Start dev server on http://localhost:3008
npm run build      # Production build (uses --webpack, not Turbopack)
npm run start      # Start production server
```

No test suite is configured. TypeScript checking: `npx tsc --noEmit`.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

**Family Market Hub** is a shared family grocery PWA. Next.js 16 App Router + Supabase (auth, database, realtime) + Tailwind CSS v4.

### Auth & Supabase client split

Two separate Supabase client factories — use the right one:
- `lib/supabase/server.ts` → `getSupabaseServerClient()` — async, uses `next/headers` cookies. For Server Components and Route Handlers only.
- `lib/supabase/client.ts` → `getSupabaseBrowserClient()` — singleton browser client. For `'use client'` components and hooks only.

`cookies()` from `next/headers` must be awaited (Next.js 15+ requirement carried into v16).

### Page routing

- `/` — Server Component that redirects to `/home` or `/login` based on Supabase auth state
- `/login` — Client Component, email/password via `supabase.auth.signInWithPassword`
- `/home` — Main shared grocery list, items grouped by priority (high/medium/low)
- `/trips` — Shopping trips list
- `/trips/[id]` — Trip detail with progress tracking and import from main list

### Data flow

All data-fetching pages are `'use client'` and use custom hooks in `/hooks/`. Each hook subscribes to Supabase Realtime (`postgres_changes`) for live updates across family members:

- `useUser` — auth state from Supabase session
- `useItems` — main grocery list; handles optimistic check-off with 500ms delay before removal
- `useSession` — active shopping session (one global session at a time)
- `useTrips` / `useTripItems` — trip CRUD and trip-scoped items
- `useProducts` — product catalog for the `CatalogPanel`

### API Routes

`app/api/items/route.ts` — `GET` (list unchecked items) and `POST` (create item). Auth-guarded via server Supabase client.

`app/api/sessions/route.ts` — `POST` (start session, ends any existing active one) and `PATCH` (end session, unlocks all session items).

### Key data model concepts

- **Items** have `priority` (high/medium/low), `is_checked`, `is_locked` (held by a shopper in an active session), and `shopping_session_id`.
- **Shopping sessions** — one active session at a time. Starting a session ends all existing ones. Items locked to a session are unlocked when the session ends.
- **Trips** — independent shopping runs separate from the shared list. Trip items (`trip_items` table) can be sourced from main list items (`source_item_id`) or typed manually.
- **Products** — a family product catalog separate from the live grocery list.

### Type aliases

`@/*` maps to the project root (e.g., `@/lib/types`, `@/hooks/useItems`). All shared types are in `lib/types.ts`.

### PWA

Service worker is registered in `app/layout.tsx` via inline script. `manifest.json` must exist in `public/`. Icons referenced at `/icons/icon-192.png`.
