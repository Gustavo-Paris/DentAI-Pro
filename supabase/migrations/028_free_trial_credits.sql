-- Free trial credits: give new users 10 credits (5 starter plan + 5 bonus)
-- This ensures new signups can immediately try the product.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, cro)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'cro');

  -- Create starter subscription with welcome bonus credits
  -- Starter plan = 5 credits/month + 5 bonus = 10 total on first month
  INSERT INTO public.subscriptions (user_id, plan_id, status, credits_used_this_month, credits_rollover, credits_bonus)
  VALUES (NEW.id, 'starter', 'active', 0, 0, 5)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
