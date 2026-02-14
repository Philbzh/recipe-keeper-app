-- Supabase migration: create a simple key/value table for the app
-- Run this in the Supabase SQL editor (or via psql / supabase CLI)

create table if not exists kv (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

-- Optional: allow easy upsert usage from client
create or replace function kv_upsert(k text, v jsonb)
returns void language sql as $$
  insert into kv (key, value) values (k, v)
  on conflict (key) do update set value = excluded.value, updated_at = now();
$$;

-- Example inserts (optional):
-- insert into kv (key, value) values ('recipes', '[]'::jsonb) on conflict (key) do nothing;
-- insert into kv (key, value) values ('shopping-list', '[]'::jsonb) on conflict (key) do nothing;
-- insert into kv (key, value) values ('categories', '[]'::jsonb) on conflict (key) do nothing;
