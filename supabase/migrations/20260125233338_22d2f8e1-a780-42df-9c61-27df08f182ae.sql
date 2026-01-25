-- Create table to store AI-detected teeth that were not selected for protocol generation
CREATE TABLE public.session_detected_teeth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id uuid NOT NULL,
  tooth text NOT NULL,
  priority text,
  treatment_indication text,
  indication_reason text,
  cavity_class text,
  restoration_size text,
  substrate text,
  substrate_condition text,
  enamel_condition text,
  depth text,
  tooth_region text,
  tooth_bounds jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Prevent duplicate teeth per session
  UNIQUE (session_id, tooth)
);

-- Enable Row Level Security
ALTER TABLE public.session_detected_teeth ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own detected teeth"
  ON public.session_detected_teeth FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own detected teeth"
  ON public.session_detected_teeth FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own detected teeth"
  ON public.session_detected_teeth FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for faster queries by session
CREATE INDEX idx_session_detected_teeth_session_id ON public.session_detected_teeth(session_id);
CREATE INDEX idx_session_detected_teeth_user_id ON public.session_detected_teeth(user_id);