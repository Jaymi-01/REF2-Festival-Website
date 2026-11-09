-- Run this only when you are ready to start the 1.0 broadcast.
-- Replace the secret placeholder in the SQL editor; do not commit the real value.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret(
  'https://www.supremenoodlefest.com/api/broadcast/run',
  'broadcast_endpoint_url'
);

select vault.create_secret(
  'REPLACE_WITH_BROADCAST_CRON_SECRET',
  'broadcast_cron_secret'
);

-- The endpoint sends at most 100 contacts per run and stops when all rows have
-- sent_at timestamps. It is safe to leave this running until the list is done.
select cron.schedule(
  'festival-1-0-broadcast',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'broadcast_endpoint_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'broadcast_cron_secret')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
