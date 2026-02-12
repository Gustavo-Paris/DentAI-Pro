-- Referral program tables
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.referral_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id),
  referred_id uuid NOT NULL REFERENCES auth.users(id),
  referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id),
  converted_at timestamptz DEFAULT now(),
  reward_granted boolean DEFAULT false,
  reward_type text,
  reward_amount integer
);

CREATE INDEX idx_referral_codes_user ON public.referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_conversions_referrer ON public.referral_conversions(referrer_id);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral codes" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own referral codes" ON public.referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own conversions" ON public.referral_conversions
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
