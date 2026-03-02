-- Fix: EXCLUDED.draft_data does not exist on evaluation_drafts_raw
--
-- The INSTEAD OF INSERT trigger references EXCLUDED.draft_data in the
-- ON CONFLICT clause, but the INSERT targets evaluation_drafts_raw which
-- only has draft_data_encrypted. EXCLUDED refers to the proposed row,
-- so we should use EXCLUDED.draft_data_encrypted (already encrypted
-- in the VALUES clause).
--
-- Error in production:
--   42703: column excluded.draft_data does not exist

CREATE OR REPLACE FUNCTION public.evaluation_drafts_view_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.evaluation_drafts_raw (
    id, user_id, draft_data_encrypted, created_at, updated_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    public.phi_encrypt(NEW.draft_data::TEXT),
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  ON CONFLICT (user_id) DO UPDATE SET
    draft_data_encrypted = EXCLUDED.draft_data_encrypted,
    updated_at = COALESCE(EXCLUDED.updated_at, now())
  RETURNING
    id, user_id,
    public.phi_decrypt(draft_data_encrypted)::JSONB AS draft_data,
    created_at, updated_at
  INTO NEW;

  RETURN NEW;
END;
$$;
