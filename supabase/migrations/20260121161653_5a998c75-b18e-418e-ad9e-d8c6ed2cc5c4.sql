-- Add inventory-aware recommendation columns
ALTER TABLE public.evaluations
ADD COLUMN is_from_inventory BOOLEAN DEFAULT false,
ADD COLUMN ideal_resin_id UUID REFERENCES public.resins(id),
ADD COLUMN ideal_reason TEXT;