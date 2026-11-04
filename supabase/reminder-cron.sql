-- Run this once in the Supabase SQL editor after deploying the site.
-- Replace the two values below before running. Do not commit real secrets.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Store the endpoint and bearer secret in Supabase Vault.
select vault.create_secret(
  'https://www.supremenoodlefest.com/api/reminders/run',
  'reminder_endpoint_url'
);

select vault.create_secret(
  'REPLACE_WITH_REMINDER_CRON_SECRET',
  'reminder_cron_secret'
);

-- The endpoint waits until noon Lagos time, then sends up to 100 recipients
-- per run. Running every 15 minutes lets a large list continue in batches.
select cron.schedule(
  'festival-reminders',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_endpoint_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- To inspect the job:
-- select jobid, jobname, schedule, active from cron.job;
-- select * from cron.job_run_details order by start_time desc limit 20;
