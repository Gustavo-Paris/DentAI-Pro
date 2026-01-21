-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create resins table with all dental resin data
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

-- Enable RLS on resins (public read)
ALTER TABLE public.resins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resins" 
ON public.resins FOR SELECT 
USING (true);

-- Create evaluations table for user clinical assessments
CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Patient info
  patient_age INTEGER NOT NULL,
  tooth TEXT NOT NULL,
  region TEXT NOT NULL,
  -- Case characteristics
  cavity_class TEXT NOT NULL,
  restoration_size TEXT NOT NULL,
  substrate TEXT NOT NULL,
  -- Aesthetic requirements
  aesthetic_level TEXT NOT NULL,
  tooth_color TEXT NOT NULL,
  stratification_needed BOOLEAN NOT NULL DEFAULT false,
  -- Additional considerations
  bruxism BOOLEAN NOT NULL DEFAULT false,
  longevity_expectation TEXT NOT NULL,
  budget TEXT NOT NULL,
  -- AI recommendation
  recommended_resin_id UUID REFERENCES public.resins(id),
  recommendation_text TEXT,
  alternatives JSONB,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on evaluations
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own evaluations" 
ON public.evaluations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own evaluations" 
ON public.evaluations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evaluations" 
ON public.evaluations FOR DELETE 
USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Insert sample resins data
INSERT INTO public.resins (name, manufacturer, type, indications, opacity, resistance, polishing, aesthetics, price_range, description) VALUES
('Filtek Z350 XT', '3M ESPE', 'Nanoparticulada', ARRAY['Classe I', 'Classe II', 'Classe III', 'Classe IV', 'Classe V'], 'Translúcido a opaco', 'Alta', 'Excelente', 'Premium', 'Premium', 'Resina nanoparticulada universal com excelente polimento e durabilidade. Ideal para restaurações anteriores e posteriores.'),
('Filtek Supreme Ultra', '3M ESPE', 'Nanoparticulada', ARRAY['Classe I', 'Classe II', 'Classe III', 'Classe IV', 'Classe V'], 'Variável', 'Alta', 'Excelente', 'Premium', 'Premium', 'Versão premium da linha Filtek com propriedades ópticas superiores.'),
('Charisma Diamond', 'Kulzer', 'Microhíbrida', ARRAY['Classe I', 'Classe II', 'Classe III', 'Classe IV'], 'Média', 'Alta', 'Muito bom', 'Alta', 'Intermediário', 'Resina microhíbrida com excelente fluorescência natural e resistência ao desgaste.'),
('Tetric N-Ceram', 'Ivoclar Vivadent', 'Nanohíbrida', ARRAY['Classe I', 'Classe II', 'Classe III', 'Classe IV', 'Classe V'], 'Média', 'Alta', 'Excelente', 'Alta', 'Premium', 'Resina nanohíbrida com nanotecnologia para resultados estéticos superiores.'),
('Opus Bulk Fill', 'FGM', 'Bulk Fill', ARRAY['Classe I', 'Classe II'], 'Opaco', 'Alta', 'Bom', 'Média', 'Econômico', 'Resina bulk fill para restaurações posteriores com incrementos de até 5mm.'),
('Z100 Restorative', '3M ESPE', 'Microhíbrida', ARRAY['Classe I', 'Classe II'], 'Opaco', 'Muito alta', 'Bom', 'Média', 'Econômico', 'Resina clássica com alta resistência mecânica para restaurações posteriores.'),
('Spectra ST', 'Dentsply', 'Nanohíbrida', ARRAY['Classe III', 'Classe IV', 'Classe V'], 'Translúcido', 'Média', 'Excelente', 'Premium', 'Intermediário', 'Resina com tecnologia SphereTEC para excelente manuseio e estética.'),
('Aura', 'SDI', 'Nanohíbrida', ARRAY['Classe I', 'Classe II', 'Classe III', 'Classe IV', 'Classe V'], 'Média', 'Alta', 'Muito bom', 'Alta', 'Intermediário', 'Resina universal com efeito camaleão e excelente adaptação de cor.'),
('Estelite Omega', 'Tokuyama', 'Supra-nano esférica', ARRAY['Classe III', 'Classe IV', 'Classe V'], 'Variável', 'Alta', 'Excelente', 'Premium', 'Premium', 'Tecnologia RAP exclusiva para polimento duradouro e estética excepcional.'),
('Beautifil II', 'Shofu', 'Giomer', ARRAY['Classe I', 'Classe II', 'Classe III', 'Classe IV', 'Classe V'], 'Média', 'Alta', 'Muito bom', 'Alta', 'Intermediário', 'Resina giomer com liberação de flúor e excelente biocompatibilidade.');
