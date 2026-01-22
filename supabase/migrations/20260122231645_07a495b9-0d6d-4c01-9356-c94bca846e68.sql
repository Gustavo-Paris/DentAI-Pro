-- Add DSD fields to evaluations table
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS dsd_analysis jsonb DEFAULT NULL;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS dsd_simulation_url text DEFAULT NULL;

-- Create storage bucket for DSD simulations
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dsd-simulations', 'dsd-simulations', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for DSD simulations bucket
CREATE POLICY "Users can view their own DSD simulations" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'dsd-simulations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own DSD simulations" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'dsd-simulations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own DSD simulations" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'dsd-simulations' AND auth.uid()::text = (storage.foldername(name))[1]);