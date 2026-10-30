-- Real Essence Festival 2.0 — registrations
--
-- Run this in the Supabase SQL editor. Registration writes are performed by
-- the Next.js server with the service-role key; no browser policy is needed.

-- Remove objects created by the previous gate-scanner build.
drop view if exists gate_stats;
drop function if exists admit(text, text, uuid, timestamptz);
drop table if exists scans;

alter table if exists registrations
  drop column if exists ticket,
  drop column if exists checked_in_at,
  drop column if exists checked_in_by,
  drop column if exists scan_count;

create table if not exists registrations (
  id         uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name  text not null,
  email      text not null,
  phone      text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists registrations_email_key
  on registrations (lower(email));

alter table registrations enable row level security;
