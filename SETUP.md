# Family Market Hub — Setup Guide

## 1. Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project (free tier)
2. Copy your **Project URL** and **anon/public key** from Settings → API

## 2. Run SQL in Supabase SQL Editor

Open the **SQL Editor** in your Supabase dashboard and run this:

```sql
-- Items table
create table items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  note text,
  requested_by uuid references auth.users(id),
  requested_by_name text,
  requested_by_avatar text,
  is_checked boolean default false,
  checked_by uuid references auth.users(id),
  checked_by_name text,
  checked_at timestamptz,
  is_locked boolean default false,
  locked_by uuid references auth.users(id),
  locked_by_name text,
  shopping_session_id uuid,
  image_url text
);

create table shopping_sessions (
  id uuid default gen_random_uuid() primary key,
  started_at timestamptz default now(),
  ended_at timestamptz,
  shopper_id uuid references auth.users(id),
  shopper_name text,
  is_active boolean default true
);

-- Row Level Security
alter table items enable row level security;
alter table shopping_sessions enable row level security;

create policy "Authenticated users full access to items"
  on items for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access to sessions"
  on shopping_sessions for all using (auth.role() = 'authenticated');

-- Realtime
alter publication supabase_realtime add table items;
alter publication supabase_realtime add table shopping_sessions;
```

## 3. Create Family Members in Supabase Auth

Go to **Authentication → Users → Invite user** for each family member.
Or use **"Add user"** to create email+password accounts directly.

Recommended accounts (use any emails you like):
- ali@family.local
- mama@family.local
- baba@family.local
- sara@family.local
- omar@family.local

## 4. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## 5. Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## 6. Deploy to Vercel

```bash
npx vercel
```

Set the two env vars in the Vercel dashboard (Settings → Environment Variables).

## PWA Install

Once deployed, visit the URL on your phone:
- **Android (Chrome)**: tap the "Add to Home Screen" prompt or use the browser menu
- **iOS (Safari)**: tap Share → "Add to Home Screen"
