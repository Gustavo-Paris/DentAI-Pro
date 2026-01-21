-- Add CRO column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cro text;

-- Create user_inventory table
CREATE TABLE public.user_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  resin_id uuid NOT NULL REFERENCES public.resins(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, resin_id)
);

-- Enable RLS
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_inventory
CREATE POLICY "Users can view their own inventory"
ON public.user_inventory FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own inventory"
ON public.user_inventory FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own inventory"
ON public.user_inventory FOR DELETE
USING (auth.uid() = user_id);