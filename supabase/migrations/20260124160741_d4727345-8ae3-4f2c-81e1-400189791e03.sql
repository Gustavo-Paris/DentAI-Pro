-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own patients"
  ON public.patients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own patients"
  ON public.patients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients"
  ON public.patients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients"
  ON public.patients FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add patient_id to evaluations
ALTER TABLE public.evaluations 
ADD COLUMN patient_id UUID REFERENCES public.patients(id);

-- Migrate existing data: create patients from unique patient_name values
INSERT INTO public.patients (user_id, name)
SELECT DISTINCT user_id, patient_name 
FROM public.evaluations 
WHERE patient_name IS NOT NULL AND patient_name != ''
ON CONFLICT (user_id, name) DO NOTHING;

-- Link existing evaluations to patients
UPDATE public.evaluations e
SET patient_id = p.id
FROM public.patients p
WHERE e.user_id = p.user_id 
  AND e.patient_name = p.name
  AND e.patient_name IS NOT NULL;