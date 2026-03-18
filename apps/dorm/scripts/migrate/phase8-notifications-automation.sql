-- Phase 8: Notifications & Automation Logs
-- Run against the Neon database to add notification and automation support.

-- Enum types
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'PAYMENT_REMINDER', 'OVERDUE_NOTICE', 'PENALTY_APPLIED',
    'BILLING_GENERATED', 'LEASE_EXPIRY', 'GENERAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('UNREAD', 'READ', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE automation_job_type AS ENUM (
    'PENALTY_CALC', 'OVERDUE_CHECK', 'UTILITY_BILLING', 'REMINDER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE automation_job_status AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id            SERIAL PRIMARY KEY,
  user_id       TEXT,
  tenant_id     INTEGER REFERENCES tenants(id),
  type          notification_type NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  status        notification_status NOT NULL DEFAULT 'UNREAD',
  related_id    INTEGER,
  related_type  TEXT,
  metadata      JSONB,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Automation logs table
CREATE TABLE IF NOT EXISTS automation_logs (
  id              SERIAL PRIMARY KEY,
  job_type        automation_job_type NOT NULL,
  status          automation_job_status NOT NULL,
  items_processed INTEGER DEFAULT 0,
  items_failed    INTEGER DEFAULT 0,
  details         JSONB,
  started_at      TIMESTAMPTZ NOT NULL,
  completed_at    TIMESTAMPTZ,
  error           TEXT
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_job_type ON automation_logs(job_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_started_at ON automation_logs(started_at DESC);
