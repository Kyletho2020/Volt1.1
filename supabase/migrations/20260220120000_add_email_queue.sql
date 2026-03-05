-- Migration: add_email_queue
-- Supports the "Email to Self" foreman briefing feature.
-- Make.com (or n8n) polls for status='pending' rows, sends the email via Gmail,
-- then updates status='sent' and sets sent_at.

CREATE TABLE email_queue (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id        uuid        REFERENCES quotes(id),          -- null when briefing covers multiple quotes
  recipient_email text        NOT NULL,
  subject         text        NOT NULL,
  body            text        NOT NULL,
  email_type      text        NOT NULL DEFAULT 'self_briefing', -- self_briefing | dispatch_confirm
  status          text        NOT NULL DEFAULT 'pending',      -- pending | sent | failed
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Index so Make.com poll query is fast
CREATE INDEX email_queue_status_idx ON email_queue (status, created_at);
