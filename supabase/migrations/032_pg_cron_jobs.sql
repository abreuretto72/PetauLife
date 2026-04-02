-- Enable required extensions for scheduled CRON jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- check-scheduled-events: 07:00 BRT (10:00 UTC) — vaccines, medications, events, birthdays
SELECT cron.schedule(
  'check-scheduled-events-morning',
  '0 10 * * *',
  $$SELECT net.http_post(
    url    := 'https://peqpkzituzpwukzusgcq.supabase.co/functions/v1/check-scheduled-events',
    body   := '{}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb
  );$$
);

-- check-scheduled-events: 20:00 BRT (23:00 UTC)
SELECT cron.schedule(
  'check-scheduled-events-evening',
  '0 23 * * *',
  $$SELECT net.http_post(
    url    := 'https://peqpkzituzpwukzusgcq.supabase.co/functions/v1/check-scheduled-events',
    body   := '{}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb
  );$$
);

-- analyze-health-patterns: 07:30 BRT (10:30 UTC) — weight/mood/symptom/preventive analysis
SELECT cron.schedule(
  'analyze-health-patterns-daily',
  '30 10 * * *',
  $$SELECT net.http_post(
    url    := 'https://peqpkzituzpwukzusgcq.supabase.co/functions/v1/analyze-health-patterns',
    body   := '{}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb
  );$$
);

-- send-push-notifications: every hour at :05 (catches all preferred_hour windows)
SELECT cron.schedule(
  'send-push-notifications-hourly',
  '5 * * * *',
  $$SELECT net.http_post(
    url    := 'https://peqpkzituzpwukzusgcq.supabase.co/functions/v1/send-push-notifications',
    body   := '{}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb
  );$$
);
