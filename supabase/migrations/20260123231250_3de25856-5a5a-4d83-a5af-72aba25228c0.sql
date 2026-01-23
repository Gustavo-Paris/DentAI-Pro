-- Add clinic logo URL column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS clinic_logo_url TEXT;