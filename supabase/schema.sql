-- supabase/schema.sql
-- Run in Supabase -> SQL Editor. Safe to run more than once.
--
-- The browser NEVER reads these tables directly. All access is through the
-- serverless API using the service-role key, so RLS is ON with NO public
-- policies (private by default).

-- ── customers ────────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text,
  contact     text,
  created_at  timestamptz not null default now()
);

-- ── purchases (one-time orders) ──────────────────────────────────────────────
create table if not exists public.purchases (
  id                  uuid primary key default gen_random_uuid(),
  razorpay_order_id   text unique not null,
  payment_id          text,
  customer_email      text not null,
  scope               text not null,          -- 'all' or '1'..'8'
  plan_key            text not null,          -- 'class' | 'all' | 'lifetime'
  kind                text not null,          -- 'year' | 'lifetime'
  amount              integer not null,       -- paise
  status              text not null default 'created',  -- 'created' | 'paid'
  expires_at          timestamptz,            -- null = lifetime
  raw                 jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_purchases_email  on public.purchases (customer_email);
create index if not exists idx_purchases_status on public.purchases (status);

-- ── RLS: on, but no public policies (server-only via service role) ───────────
alter table public.customers enable row level security;
alter table public.purchases enable row level security;

-- (No CREATE POLICY: service-role key bypasses RLS; anon gets nothing.
--  If you later add end-user auth, add scoped SELECT policies keyed on
--  auth.jwt()->>'email' = customer_email.)
