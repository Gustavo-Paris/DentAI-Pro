-- Restrict add_bonus_credits() to backend-only usage.
-- The function mutates subscription balances and must not be callable by
-- client-side authenticated users, otherwise any logged-in user can self-credit.

REVOKE ALL ON FUNCTION public.add_bonus_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_bonus_credits(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.add_bonus_credits(UUID, INTEGER) FROM authenticated;

-- Explicitly allow only service_role/backend calls.
GRANT EXECUTE ON FUNCTION public.add_bonus_credits(UUID, INTEGER) TO service_role;
