ALTER TABLE public.evaluations 
ADD COLUMN checklist_progress jsonb DEFAULT '[]'::jsonb;