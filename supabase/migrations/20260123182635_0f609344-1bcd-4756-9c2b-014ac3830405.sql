-- Add tooth_bounds column to store the position of the detected tooth in the image
ALTER TABLE public.evaluations 
ADD COLUMN tooth_bounds JSONB;