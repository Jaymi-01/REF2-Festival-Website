-- =============================================================================
-- Real Essence Festival 2.0 — registrations and gate check-in
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
-- =============================================================================

-- gen_random_uuid() is core Postgres since 13, so no extension is needed.

-- -----------------------------------------------------------------------------
-- Everyone who registered.
-- -----------------------------------------------------------------------------
create table if not exists registrations (
  id              uuid primary key default gen_random_uuid(),
  ticket          text not null unique,          -- 8-char Crockford base32
  first_name      text not null,
  last_name       text not null,
  email           text not null,
  phone           text not null,
  created_at      timestamptz not null default now(),

  -- gate state
  checked_in_at   timestamptz,
  checked_in_by   text,                          -- device label, e.g. "Gate 2"
  scan_count      int not null default 0         -- includes refused re-scans
);

-- One registration per email. Re-registering returns the original ticket
-- rather than issuing a second one.
create unique index if not exists registrations_email_key
  on registrations (lower(email));

create index if not exists registrations_checked_in_idx
  on registrations (checked_in_at);

-- -----------------------------------------------------------------------------
-- Every scan attempt, including the refused ones. This is the audit trail and
-- it is what makes the offline queue safe to replay: `id` is generated on the
-- device, so re-sending a queued scan can never double-count.
-- -----------------------------------------------------------------------------
create table if not exists scans (
  id          uuid primary key,                  -- client-generated
  ticket      text not null,
  result      text not null check (result in ('admitted','duplicate','unknown','bad_signature')),
  scanned_at  timestamptz not null,
  synced_at   timestamptz not null default now(),
  device      text
);

create index if not exists scans_ticket_idx on scans (ticket);
create index if not exists scans_scanned_at_idx on scans (scanned_at desc);

-- -----------------------------------------------------------------------------
-- Admit someone, atomically.
--
-- Returns one row: (result, first_name, last_name, checked_in_at).
--   admitted  — first valid scan, now marked as entered
--   duplicate — this ticket already walked in (checked_in_at tells you when)
--   unknown   — no such ticket
--
-- The UPDATE ... WHERE checked_in_at IS NULL is what makes this safe when
-- several gates scan the same ticket at the same instant: exactly one UPDATE
-- can match, so exactly one scanner sees 'admitted'.
-- -----------------------------------------------------------------------------
create or replace function admit(
  p_ticket     text,
  p_device     text,
  p_scan_id    uuid,
  p_scanned_at timestamptz
)
returns table (result text, first_name text, last_name text, checked_in_at timestamptz)
language plpgsql
security definer
as $$
declare
  v_row registrations%rowtype;
  v_result text;
begin
  -- Replaying a queued scan must be a no-op, not a second check-in.
  if exists (select 1 from scans s where s.id = p_scan_id) then
    select s.result into v_result from scans s where s.id = p_scan_id;
    select * into v_row from registrations r where r.ticket = p_ticket;
    return query select v_result, v_row.first_name, v_row.last_name, v_row.checked_in_at;
    return;
  end if;

  update registrations r
     set checked_in_at = p_scanned_at,
         checked_in_by = p_device,
         scan_count    = r.scan_count + 1
   where r.ticket = p_ticket
     and r.checked_in_at is null
  returning * into v_row;

  if found then
    v_result := 'admitted';
  else
    select * into v_row from registrations r where r.ticket = p_ticket;
    if v_row.id is null then
      v_result := 'unknown';
    else
      v_result := 'duplicate';
      update registrations r set scan_count = r.scan_count + 1 where r.id = v_row.id;
    end if;
  end if;

  insert into scans (id, ticket, result, scanned_at, device)
  values (p_scan_id, p_ticket, v_result, p_scanned_at, p_device)
  on conflict (id) do nothing;

  return query select v_result, v_row.first_name, v_row.last_name, v_row.checked_in_at;
end;
$$;

-- -----------------------------------------------------------------------------
-- Live gate numbers, for the scanner's status bar.
-- -----------------------------------------------------------------------------
create or replace view gate_stats as
  select
    count(*)                                         as registered,
    count(*) filter (where checked_in_at is not null) as admitted
  from registrations;

-- -----------------------------------------------------------------------------
-- Lock the tables down. Every read and write goes through the Next.js server
-- using the service-role key; nothing touches Supabase from the browser, so no
-- anon policy is granted here on purpose.
-- -----------------------------------------------------------------------------
alter table registrations enable row level security;
alter table scans         enable row level security;
