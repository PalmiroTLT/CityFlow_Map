-- ============================================
-- CRON Jobs Setup for Retro City Map
-- ============================================
-- IMPORTANT: Replace YOUR_PROJECT_URL and YOUR_ANON_KEY with actual values!
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- Job 1: Process Subscriptions (every 6 hours)
-- ============================================
SELECT cron.schedule(
  'process-subscriptions',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_URL/functions/v1/process-subscriptions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- ============================================
-- Job 2: Process Scheduled Notifications (every 5 minutes)
-- ============================================
SELECT cron.schedule(
  'process-scheduled-notifications',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_URL/functions/v1/process-scheduled-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- ============================================
-- Verify CRON jobs
-- ============================================
SELECT * FROM cron.job;

-- ============================================
-- View CRON job execution logs
-- ============================================
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- ============================================
-- Unschedule a job (if needed)
-- ============================================
-- SELECT cron.unschedule('process-subscriptions');
-- SELECT cron.unschedule('process-scheduled-notifications');