-- Create new resin_catalog table with specific shades
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

-- Enable RLS
ALTER TABLE public.resin_catalog ENABLE ROW LEVEL SECURITY;

-- Anyone can view the catalog
CREATE POLICY "Anyone can view resin catalog"
ON public.resin_catalog
FOR SELECT
USING (true);

-- Insert 3M Filtek Z350 XT resins
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
-- Esmalte
('3M', 'Filtek Z350 XT', 'A1E', 'Esmalte', 'baixa'),
('3M', 'Filtek Z350 XT', 'A2E', 'Esmalte', 'baixa'),
('3M', 'Filtek Z350 XT', 'A3E', 'Esmalte', 'baixa'),
('3M', 'Filtek Z350 XT', 'B1E', 'Esmalte', 'baixa'),
('3M', 'Filtek Z350 XT', 'B2E', 'Esmalte', 'baixa'),
-- Dentina
('3M', 'Filtek Z350 XT', 'A1D', 'Dentina', 'alta'),
('3M', 'Filtek Z350 XT', 'A2D', 'Dentina', 'alta'),
('3M', 'Filtek Z350 XT', 'A3D', 'Dentina', 'alta'),
('3M', 'Filtek Z350 XT', 'A4D', 'Dentina', 'alta'),
('3M', 'Filtek Z350 XT', 'B1D', 'Dentina', 'alta'),
-- Body
('3M', 'Filtek Z350 XT', 'A1B', 'Body', 'media'),
('3M', 'Filtek Z350 XT', 'A2B', 'Body', 'media'),
('3M', 'Filtek Z350 XT', 'A3B', 'Body', 'media'),
('3M', 'Filtek Z350 XT', 'A3.5B', 'Body', 'media'),
('3M', 'Filtek Z350 XT', 'B2B', 'Body', 'media'),
-- Translúcido
('3M', 'Filtek Z350 XT', 'CT', 'Translucido', 'muito_baixa'),
('3M', 'Filtek Z350 XT', 'GT', 'Translucido', 'muito_baixa'),
('3M', 'Filtek Z350 XT', 'WT', 'Translucido', 'muito_baixa'),
-- Opaco
('3M', 'Filtek Z350 XT', 'OA2', 'Opaco', 'muito_alta'),
('3M', 'Filtek Z350 XT', 'OA3', 'Opaco', 'muito_alta'),
('3M', 'Filtek Z350 XT', 'OA3.5', 'Opaco', 'muito_alta');

-- Insert Ivoclar IPS Empress Direct
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

-- Insert Tokuyama Estelite Sigma Quick
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
('Tokuyama', 'Estelite Sigma Quick', 'WE', 'Esmalte', 'baixa');

-- Insert SDI Aura
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('SDI', 'Aura', 'A1', 'Universal', 'media'),
('SDI', 'Aura', 'A2', 'Universal', 'media'),
('SDI', 'Aura', 'A3', 'Universal', 'media'),
('SDI', 'Aura', 'A3.5', 'Universal', 'media'),
('SDI', 'Aura', 'B1', 'Universal', 'media'),
('SDI', 'Aura', 'DC1', 'Dentina', 'alta'),
('SDI', 'Aura', 'DC2', 'Dentina', 'alta'),
('SDI', 'Aura', 'EC1', 'Esmalte', 'baixa'),
('SDI', 'Aura', 'EC2', 'Esmalte', 'baixa');

-- Insert Kulzer Venus Diamond
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Kulzer', 'Venus Diamond', 'A1', 'Universal', 'media'),
('Kulzer', 'Venus Diamond', 'A2', 'Universal', 'media'),
('Kulzer', 'Venus Diamond', 'A3', 'Universal', 'media'),
('Kulzer', 'Venus Diamond', 'A3.5', 'Universal', 'media'),
('Kulzer', 'Venus Diamond', 'B1', 'Universal', 'media'),
('Kulzer', 'Venus Diamond', 'OL', 'Opaco', 'muito_alta'),
('Kulzer', 'Venus Diamond', 'OM', 'Opaco', 'muito_alta'),
('Kulzer', 'Venus Diamond', 'CL', 'Translucido', 'muito_baixa'),
('Kulzer', 'Venus Diamond', 'CM', 'Translucido', 'muito_baixa');

-- Insert Shofu Beautifil II
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Shofu', 'Beautifil II', 'A1', 'Universal', 'media'),
('Shofu', 'Beautifil II', 'A2', 'Universal', 'media'),
('Shofu', 'Beautifil II', 'A3', 'Universal', 'media'),
('Shofu', 'Beautifil II', 'A3.5', 'Universal', 'media'),
('Shofu', 'Beautifil II', 'B1', 'Universal', 'media'),
('Shofu', 'Beautifil II', 'Inc', 'Translucido', 'muito_baixa'),
('Shofu', 'Beautifil II', 'Trans', 'Translucido', 'muito_baixa');

-- Insert GC Essentia
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('GC', 'Essentia', 'Light Enamel', 'Esmalte', 'baixa'),
('GC', 'Essentia', 'Medium Enamel', 'Esmalte', 'baixa'),
('GC', 'Essentia', 'Dark Enamel', 'Esmalte', 'baixa'),
('GC', 'Essentia', 'Light Dentin', 'Dentina', 'alta'),
('GC', 'Essentia', 'Medium Dentin', 'Dentina', 'alta'),
('GC', 'Essentia', 'Dark Dentin', 'Dentina', 'alta'),
('GC', 'Essentia', 'Modifier Opaque', 'Opaco', 'muito_alta'),
('GC', 'Essentia', 'Modifier White', 'Opaco', 'muito_alta');

-- Insert GC G-aenial
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('GC', 'G-aenial', 'A1', 'Universal', 'media'),
('GC', 'G-aenial', 'A2', 'Universal', 'media'),
('GC', 'G-aenial', 'A3', 'Universal', 'media'),
('GC', 'G-aenial', 'A3.5', 'Universal', 'media'),
('GC', 'G-aenial', 'B1', 'Universal', 'media'),
('GC', 'G-aenial', 'AO2', 'Opaco', 'muito_alta'),
('GC', 'G-aenial', 'AO3', 'Opaco', 'muito_alta'),
('GC', 'G-aenial', 'JE', 'Esmalte', 'baixa'),
('GC', 'G-aenial', 'CVT', 'Translucido', 'muito_baixa');