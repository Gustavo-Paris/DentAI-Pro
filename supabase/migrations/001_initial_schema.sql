-- ===========================================
-- DentAI Pro - Migration Script
-- Execute este SQL no SQL Editor do Supabase
-- ===========================================

-- 1.1 Funcoes e Triggers Base
-- -------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, cro)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'cro');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 1.2 Tabela profiles
-- -------------------------------------------

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  cro TEXT,
  avatar_url TEXT,
  clinic_name TEXT,
  clinic_logo_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- 1.3 Tabela resins (catalogo de resinas)
-- -------------------------------------------

CREATE TABLE public.resins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  type TEXT NOT NULL,
  indications TEXT[] NOT NULL DEFAULT '{}',
  opacity TEXT NOT NULL,
  resistance TEXT NOT NULL,
  polishing TEXT NOT NULL,
  aesthetics TEXT NOT NULL,
  price_range TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resins"
ON public.resins FOR SELECT
USING (true);

INSERT INTO public.resins (name, manufacturer, type, indications, opacity, resistance, polishing, aesthetics, price_range, description) VALUES
('Filtek Z350 XT', '3M ESPE', 'Nanoparticulada', ARRAY['Classe I', 'Classe II', 'Classe III', 'Classe IV', 'Classe V'], 'Translucido a opaco', 'Alta', 'Excelente', 'Premium', 'Premium', 'Resina nanoparticulada universal com excelente polimento e durabilidade.'),
('Filtek Supreme Ultra', '3M ESPE', 'Nanoparticulada', ARRAY['Classe I', 'Classe II', 'Classe III', 'Classe IV', 'Classe V'], 'Variavel', 'Alta', 'Excelente', 'Premium', 'Premium', 'Versao premium da linha Filtek com propriedades opticas superiores.'),
('Charisma Diamond', 'Kulzer', 'Microhibrida', ARRAY['Classe I', 'Classe II', 'Classe III', 'Classe IV'], 'Media', 'Alta', 'Muito bom', 'Alta', 'Intermediario', 'Resina microhibrida com excelente fluorescencia natural.'),
('Tetric N-Ceram', 'Ivoclar Vivadent', 'Nanohibrida', ARRAY['Classe I', 'Classe II', 'Classe III', 'Classe IV', 'Classe V'], 'Media', 'Alta', 'Excelente', 'Alta', 'Premium', 'Resina nanohibrida com nanotecnologia para resultados esteticos superiores.'),
('Opus Bulk Fill', 'FGM', 'Bulk Fill', ARRAY['Classe I', 'Classe II'], 'Opaco', 'Alta', 'Bom', 'Media', 'Economico', 'Resina bulk fill para restauracoes posteriores com incrementos de ate 5mm.'),
('Z100 Restorative', '3M ESPE', 'Microhibrida', ARRAY['Classe I', 'Classe II'], 'Opaco', 'Muito alta', 'Bom', 'Media', 'Economico', 'Resina classica com alta resistencia mecanica.'),
('Spectra ST', 'Dentsply', 'Nanohibrida', ARRAY['Classe III', 'Classe IV', 'Classe V'], 'Translucido', 'Media', 'Excelente', 'Premium', 'Intermediario', 'Resina com tecnologia SphereTEC para excelente manuseio.'),
('Aura', 'SDI', 'Nanohibrida', ARRAY['Classe I', 'Classe II', 'Classe III', 'Classe IV', 'Classe V'], 'Media', 'Alta', 'Muito bom', 'Alta', 'Intermediario', 'Resina universal com efeito camaleao.'),
('Estelite Omega', 'Tokuyama', 'Supra-nano esferica', ARRAY['Classe III', 'Classe IV', 'Classe V'], 'Variavel', 'Alta', 'Excelente', 'Premium', 'Premium', 'Tecnologia RAP exclusiva para polimento duradouro.'),
('Beautifil II', 'Shofu', 'Giomer', ARRAY['Classe I', 'Classe II', 'Classe III', 'Classe IV', 'Classe V'], 'Media', 'Alta', 'Muito bom', 'Alta', 'Intermediario', 'Resina giomer com liberacao de fluor.');


-- 1.4 Tabela resin_catalog (catalogo detalhado por cores)
-- -------------------------------------------

CREATE TABLE public.resin_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  product_line TEXT NOT NULL,
  shade TEXT NOT NULL,
  type TEXT NOT NULL,
  opacity TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand, product_line, shade)
);

ALTER TABLE public.resin_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resin catalog"
ON public.resin_catalog
FOR SELECT
USING (true);

-- Dados: 3M Filtek Z350 XT
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('3M', 'Filtek Z350 XT', 'A1E', 'Esmalte', 'baixa'),
('3M', 'Filtek Z350 XT', 'A2E', 'Esmalte', 'baixa'),
('3M', 'Filtek Z350 XT', 'A3E', 'Esmalte', 'baixa'),
('3M', 'Filtek Z350 XT', 'B1E', 'Esmalte', 'baixa'),
('3M', 'Filtek Z350 XT', 'B2E', 'Esmalte', 'baixa'),
('3M', 'Filtek Z350 XT', 'A1D', 'Dentina', 'alta'),
('3M', 'Filtek Z350 XT', 'A2D', 'Dentina', 'alta'),
('3M', 'Filtek Z350 XT', 'A3D', 'Dentina', 'alta'),
('3M', 'Filtek Z350 XT', 'A4D', 'Dentina', 'alta'),
('3M', 'Filtek Z350 XT', 'B1D', 'Dentina', 'alta'),
('3M', 'Filtek Z350 XT', 'A1B', 'Body', 'media'),
('3M', 'Filtek Z350 XT', 'A2B', 'Body', 'media'),
('3M', 'Filtek Z350 XT', 'A3B', 'Body', 'media'),
('3M', 'Filtek Z350 XT', 'A3.5B', 'Body', 'media'),
('3M', 'Filtek Z350 XT', 'B2B', 'Body', 'media'),
('3M', 'Filtek Z350 XT', 'CT', 'Translucido', 'muito_baixa'),
('3M', 'Filtek Z350 XT', 'GT', 'Translucido', 'muito_baixa'),
('3M', 'Filtek Z350 XT', 'WT', 'Translucido', 'muito_baixa'),
('3M', 'Filtek Z350 XT', 'OA2', 'Opaco', 'muito_alta'),
('3M', 'Filtek Z350 XT', 'OA3', 'Opaco', 'muito_alta'),
('3M', 'Filtek Z350 XT', 'OA3.5', 'Opaco', 'muito_alta');

-- Dados: Ivoclar IPS Empress Direct
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Ivoclar', 'IPS Empress Direct', 'A1 Enamel', 'Esmalte', 'baixa'),
('Ivoclar', 'IPS Empress Direct', 'A2 Enamel', 'Esmalte', 'baixa'),
('Ivoclar', 'IPS Empress Direct', 'A3 Enamel', 'Esmalte', 'baixa'),
('Ivoclar', 'IPS Empress Direct', 'A1 Dentin', 'Dentina', 'alta'),
('Ivoclar', 'IPS Empress Direct', 'A2 Dentin', 'Dentina', 'alta'),
('Ivoclar', 'IPS Empress Direct', 'A3 Dentin', 'Dentina', 'alta'),
('Ivoclar', 'IPS Empress Direct', 'Trans 20', 'Translucido', 'muito_baixa'),
('Ivoclar', 'IPS Empress Direct', 'Trans 30', 'Translucido', 'muito_baixa'),
('Ivoclar', 'IPS Empress Direct', 'Opaque White', 'Opaco', 'muito_alta'),
('Ivoclar', 'IPS Empress Direct', 'Opaque Brown', 'Opaco', 'muito_alta');

-- Dados: Tokuyama, SDI, Kulzer, Shofu, GC
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Tokuyama', 'Estelite Sigma Quick', 'A1', 'Universal', 'media'),
('Tokuyama', 'Estelite Sigma Quick', 'A2', 'Universal', 'media'),
('Tokuyama', 'Estelite Sigma Quick', 'A3', 'Universal', 'media'),
('Tokuyama', 'Estelite Sigma Quick', 'A3.5', 'Universal', 'media'),
('Tokuyama', 'Estelite Sigma Quick', 'B1', 'Universal', 'media'),
('Tokuyama', 'Estelite Sigma Quick', 'B2', 'Universal', 'media'),
('Tokuyama', 'Estelite Sigma Quick', 'OA2', 'Opaco', 'muito_alta'),
('Tokuyama', 'Estelite Sigma Quick', 'OA3', 'Opaco', 'muito_alta'),
('Tokuyama', 'Estelite Sigma Quick', 'CE', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Sigma Quick', 'WE', 'Esmalte', 'baixa'),
('SDI', 'Aura', 'A1', 'Universal', 'media'),
('SDI', 'Aura', 'A2', 'Universal', 'media'),
('SDI', 'Aura', 'A3', 'Universal', 'media'),
('SDI', 'Aura', 'A3.5', 'Universal', 'media'),
('SDI', 'Aura', 'B1', 'Universal', 'media'),
('SDI', 'Aura', 'DC1', 'Dentina', 'alta'),
('SDI', 'Aura', 'DC2', 'Dentina', 'alta'),
('SDI', 'Aura', 'EC1', 'Esmalte', 'baixa'),
('SDI', 'Aura', 'EC2', 'Esmalte', 'baixa'),
('Kulzer', 'Venus Diamond', 'A1', 'Universal', 'media'),
('Kulzer', 'Venus Diamond', 'A2', 'Universal', 'media'),
('Kulzer', 'Venus Diamond', 'A3', 'Universal', 'media'),
('Kulzer', 'Venus Diamond', 'A3.5', 'Universal', 'media'),
('Kulzer', 'Venus Diamond', 'B1', 'Universal', 'media'),
('Kulzer', 'Venus Diamond', 'OL', 'Opaco', 'muito_alta'),
('Kulzer', 'Venus Diamond', 'OM', 'Opaco', 'muito_alta'),
('Kulzer', 'Venus Diamond', 'CL', 'Translucido', 'muito_baixa'),
('Kulzer', 'Venus Diamond', 'CM', 'Translucido', 'muito_baixa'),
('Shofu', 'Beautifil II', 'A1', 'Universal', 'media'),
('Shofu', 'Beautifil II', 'A2', 'Universal', 'media'),
('Shofu', 'Beautifil II', 'A3', 'Universal', 'media'),
('Shofu', 'Beautifil II', 'A3.5', 'Universal', 'media'),
('Shofu', 'Beautifil II', 'B1', 'Universal', 'media'),
('Shofu', 'Beautifil II', 'Inc', 'Translucido', 'muito_baixa'),
('Shofu', 'Beautifil II', 'Trans', 'Translucido', 'muito_baixa'),
('GC', 'Essentia', 'Light Enamel', 'Esmalte', 'baixa'),
('GC', 'Essentia', 'Medium Enamel', 'Esmalte', 'baixa'),
('GC', 'Essentia', 'Dark Enamel', 'Esmalte', 'baixa'),
('GC', 'Essentia', 'Light Dentin', 'Dentina', 'alta'),
('GC', 'Essentia', 'Medium Dentin', 'Dentina', 'alta'),
('GC', 'Essentia', 'Dark Dentin', 'Dentina', 'alta'),
('GC', 'Essentia', 'Modifier Opaque', 'Opaco', 'muito_alta'),
('GC', 'Essentia', 'Modifier White', 'Opaco', 'muito_alta'),
('GC', 'G-aenial', 'A1', 'Universal', 'media'),
('GC', 'G-aenial', 'A2', 'Universal', 'media'),
('GC', 'G-aenial', 'A3', 'Universal', 'media'),
('GC', 'G-aenial', 'A3.5', 'Universal', 'media'),
('GC', 'G-aenial', 'B1', 'Universal', 'media'),
('GC', 'G-aenial', 'AO2', 'Opaco', 'muito_alta'),
('GC', 'G-aenial', 'AO3', 'Opaco', 'muito_alta'),
('GC', 'G-aenial', 'JE', 'Esmalte', 'baixa'),
('GC', 'G-aenial', 'CVT', 'Translucido', 'muito_baixa');


-- 1.5 Tabela patients
-- -------------------------------------------

CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- 1.6 Tabela evaluations
-- -------------------------------------------

CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id),
  patient_name TEXT,
  patient_age INTEGER NOT NULL,
  tooth TEXT NOT NULL,
  region TEXT NOT NULL,
  cavity_class TEXT NOT NULL,
  restoration_size TEXT NOT NULL,
  substrate TEXT NOT NULL,
  substrate_condition TEXT,
  enamel_condition TEXT,
  depth TEXT,
  aesthetic_level TEXT NOT NULL,
  tooth_color TEXT NOT NULL,
  stratification_needed BOOLEAN NOT NULL DEFAULT false,
  bruxism BOOLEAN NOT NULL DEFAULT false,
  longevity_expectation TEXT NOT NULL,
  budget TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'draft',
  treatment_type TEXT DEFAULT 'resina',
  desired_tooth_shape TEXT,
  -- AI Recommendations
  recommended_resin_id UUID REFERENCES public.resins(id),
  recommendation_text TEXT,
  alternatives JSONB,
  ideal_resin_id UUID REFERENCES public.resins(id),
  ideal_reason TEXT,
  is_from_inventory BOOLEAN DEFAULT false,
  has_inventory_at_creation BOOLEAN DEFAULT false,
  ai_treatment_indication TEXT,
  ai_indication_reason TEXT,
  -- Protocols
  stratification_protocol JSONB,
  protocol_layers JSONB,
  cementation_protocol JSONB,
  generic_protocol JSONB,
  checklist_progress JSONB DEFAULT '[]'::jsonb,
  alerts JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  -- Photos
  photo_frontal TEXT,
  photo_45 TEXT,
  photo_face TEXT,
  additional_photos JSONB DEFAULT '{}'::jsonb,
  tooth_bounds JSONB,
  -- DSD
  dsd_analysis JSONB,
  dsd_simulation_url TEXT,
  simulation_url TEXT,
  -- Patient preferences
  patient_aesthetic_goals TEXT,
  patient_desired_changes TEXT[],
  -- Session
  session_id UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own evaluations"
ON public.evaluations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own evaluations"
ON public.evaluations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evaluations"
ON public.evaluations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evaluations"
ON public.evaluations FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_session_id ON evaluations(session_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_additional_photos ON evaluations USING gin (additional_photos) WHERE additional_photos != '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_evaluations_patient_desired_changes ON evaluations USING gin (patient_desired_changes);


-- 1.7 Tabela user_inventory
-- -------------------------------------------

CREATE TABLE public.user_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resin_id UUID NOT NULL REFERENCES public.resin_catalog(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, resin_id)
);

ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own inventory"
ON public.user_inventory FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own inventory"
ON public.user_inventory FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own inventory"
ON public.user_inventory FOR DELETE
USING (auth.uid() = user_id);


-- 1.8 Tabela evaluation_drafts
-- -------------------------------------------

CREATE TABLE public.evaluation_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  draft_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.evaluation_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts"
ON public.evaluation_drafts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts"
ON public.evaluation_drafts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
ON public.evaluation_drafts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
ON public.evaluation_drafts FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_evaluation_drafts_updated_at
BEFORE UPDATE ON public.evaluation_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 1.9 Tabela session_detected_teeth
-- -------------------------------------------

CREATE TABLE public.session_detected_teeth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  tooth TEXT NOT NULL,
  priority TEXT,
  treatment_indication TEXT,
  indication_reason TEXT,
  cavity_class TEXT,
  restoration_size TEXT,
  substrate TEXT,
  substrate_condition TEXT,
  enamel_condition TEXT,
  depth TEXT,
  tooth_region TEXT,
  tooth_bounds JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, tooth)
);

ALTER TABLE public.session_detected_teeth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own detected teeth"
  ON public.session_detected_teeth FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own detected teeth"
  ON public.session_detected_teeth FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own detected teeth"
  ON public.session_detected_teeth FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_session_detected_teeth_session_id ON public.session_detected_teeth(session_id);
CREATE INDEX idx_session_detected_teeth_user_id ON public.session_detected_teeth(user_id);
