-- Add column to track if user had inventory when creating evaluation
ALTER TABLE public.evaluations 
ADD COLUMN has_inventory_at_creation BOOLEAN DEFAULT false;