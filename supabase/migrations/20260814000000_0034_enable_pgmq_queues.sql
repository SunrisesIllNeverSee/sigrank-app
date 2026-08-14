-- 0034_enable_pgmq_queues.sql
-- Enable Supabase Queues (pgmq) for burst protection on snapshot submissions.
--
-- Free plan: pgmq is included. Queues are Postgres-native, durable message
-- queues with guaranteed delivery — like AWS SQS but on Postgres.
--
-- Use case: When traffic spikes (e.g. a viral tweet about SigRank), snapshot
-- submissions can be queued instead of processed synchronously. A pg_cron job
-- or application worker drains the queue at a controlled rate, preventing
-- database write contention and API timeout cascades.
--
-- The queue is created at extension-enable time. Application code enqueues
-- via:  SELECT pgmq.send('snapshot_submissions', jsonb_build_object(...));
-- And dequeues via: SELECT * FROM pgmq.read('snapshot_submissions', 30, 1);

CREATE SCHEMA IF NOT EXISTS pgmq;
CREATE EXTENSION IF NOT EXISTS pgmq SCHEMA pgmq;
SELECT pgmq.create('snapshot_submissions');
