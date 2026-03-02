-- Fix: Recreate UNIQUE(user_id) constraint on evaluation_drafts_raw
--
-- Migration 046 renamed evaluation_drafts → evaluation_drafts_raw but
-- did NOT recreate the UNIQUE(user_id) constraint on the renamed table.
-- The INSTEAD OF INSERT trigger uses ON CONFLICT (user_id), which requires
-- this constraint to exist.
--
-- Error in production:
--   42P10: there is no unique or exclusion constraint matching the
--          ON CONFLICT specification

ALTER TABLE public.evaluation_drafts_raw
  ADD CONSTRAINT evaluation_drafts_raw_user_id_key UNIQUE (user_id);
