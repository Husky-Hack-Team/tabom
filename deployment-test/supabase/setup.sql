-- Run once in the Supabase SQL Editor for the project you want to test.
-- The browser has no access. Only a server-side Supabase secret can use this table.

create table if not exists public.deployment_checks (
  check_id uuid primary key,
  source text not null check (char_length(source) between 1 and 80),
  created_at timestamptz not null default now()
);

alter table public.deployment_checks enable row level security;

revoke all on table public.deployment_checks from public, anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, delete on table public.deployment_checks to service_role;

comment on table public.deployment_checks is
  'Temporary rows used by the Vercel deployment smoke test.';
