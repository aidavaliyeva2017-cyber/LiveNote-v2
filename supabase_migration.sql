-- Migration: extend events table with all new fields
-- Run once in the Supabase SQL editor

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS all_day                BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS category               VARCHAR(50)  NOT NULL DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS priority               VARCHAR(50)  NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS completed              BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS event_type             VARCHAR(50)  NOT NULL DEFAULT 'event',
  ADD COLUMN IF NOT EXISTS travel_time            VARCHAR(50),
  ADD COLUMN IF NOT EXISTS repeat                 VARCHAR(50),
  ADD COLUMN IF NOT EXISTS repeat_end_date        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS custom_repeat_interval VARCHAR(50),
  ADD COLUMN IF NOT EXISTS alert                  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS url                    TEXT;
