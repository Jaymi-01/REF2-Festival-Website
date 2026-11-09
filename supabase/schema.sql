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

alter table if exists registrations
  add column if not exists reminder_week_sent_at timestamptz,
  add column if not exists reminder_final_sent_at timestamptz;

create table if not exists registrations (
  id         uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name  text not null,
  email      text not null,
  phone      text not null,
  created_at timestamptz not null default now(),
  reminder_week_sent_at timestamptz,
  reminder_final_sent_at timestamptz
);

create unique index if not exists registrations_email_key
  on registrations (lower(email));

alter table registrations enable row level security;

-- Private audience for the one-time 1.0 broadcast. The app uses the
-- service-role key server-side; no browser policy is granted for this table.
create table if not exists broadcast_contacts (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  sent_at    timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists broadcast_contacts_email_key
  on broadcast_contacts (lower(email));

alter table broadcast_contacts enable row level security;
