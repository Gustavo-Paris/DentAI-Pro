-- 017: Expand resin catalog with new brands
-- Adds: Tokuyama Forma, Tokuyama Palfique LX5, Tokuyama Estelite Omega,
--        Kerr Harmonize, FGM Vittra APS, FGM Opallis Flow, Kerr Kolor+ Plus,
--        Additional Z350 XT shades (BT, YT)

-- Tokuyama Forma (Ultradent distributed)
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Tokuyama', 'Forma', 'WB', 'Body', 'media'),
('Tokuyama', 'Forma', 'A1', 'Universal', 'media'),
('Tokuyama', 'Forma', 'A2', 'Universal', 'media'),
('Tokuyama', 'Forma', 'A3', 'Universal', 'media'),
('Tokuyama', 'Forma', 'A3.5', 'Universal', 'media'),
('Tokuyama', 'Forma', 'B1', 'Universal', 'media'),
('Tokuyama', 'Forma', 'Trans', 'Translucido', 'muito_baixa'),
('Tokuyama', 'Forma', 'OA1', 'Opaco', 'muito_alta'),
('Tokuyama', 'Forma', 'OA2', 'Opaco', 'muito_alta'),
('Tokuyama', 'Forma', 'BL', 'Esmalte', 'baixa')
ON CONFLICT (brand, product_line, shade) DO NOTHING;

-- Tokuyama Palfique LX5
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Tokuyama', 'Palfique LX5', 'WE', 'Esmalte', 'baixa'),
('Tokuyama', 'Palfique LX5', 'CE', 'Esmalte', 'baixa'),
('Tokuyama', 'Palfique LX5', 'A1', 'Universal', 'media'),
('Tokuyama', 'Palfique LX5', 'A2', 'Universal', 'media'),
('Tokuyama', 'Palfique LX5', 'A3', 'Universal', 'media'),
('Tokuyama', 'Palfique LX5', 'B1', 'Universal', 'media'),
('Tokuyama', 'Palfique LX5', 'BL1', 'Esmalte', 'baixa'),
('Tokuyama', 'Palfique LX5', 'BL2', 'Esmalte', 'baixa'),
('Tokuyama', 'Palfique LX5', 'BL3', 'Esmalte', 'baixa')
ON CONFLICT (brand, product_line, shade) DO NOTHING;

-- Tokuyama Estelite Omega
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Tokuyama', 'Estelite Omega', 'WE', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Omega', 'JE', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Omega', 'MW', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Omega', 'CT', 'Translucido', 'muito_baixa'),
('Tokuyama', 'Estelite Omega', 'A1', 'Universal', 'media'),
('Tokuyama', 'Estelite Omega', 'A2', 'Universal', 'media'),
('Tokuyama', 'Estelite Omega', 'A3', 'Universal', 'media'),
('Tokuyama', 'Estelite Omega', 'B1', 'Universal', 'media'),
('Tokuyama', 'Estelite Omega', 'DA1', 'Dentina', 'alta'),
('Tokuyama', 'Estelite Omega', 'DA2', 'Dentina', 'alta'),
('Tokuyama', 'Estelite Omega', 'OA2', 'Opaco', 'muito_alta')
ON CONFLICT (brand, product_line, shade) DO NOTHING;

-- Kerr Harmonize
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Kerr', 'Harmonize', 'XLE', 'Esmalte', 'baixa'),
('Kerr', 'Harmonize', 'Incisal', 'Esmalte', 'baixa'),
('Kerr', 'Harmonize', 'TN', 'Translucido', 'muito_baixa'),
('Kerr', 'Harmonize', 'A1', 'Universal', 'media'),
('Kerr', 'Harmonize', 'A2', 'Universal', 'media'),
('Kerr', 'Harmonize', 'A3', 'Universal', 'media'),
('Kerr', 'Harmonize', 'B1', 'Universal', 'media'),
('Kerr', 'Harmonize', 'BL', 'Esmalte', 'baixa'),
('Kerr', 'Harmonize', 'OA2', 'Opaco', 'muito_alta'),
('Kerr', 'Harmonize', 'OA3', 'Opaco', 'muito_alta')
ON CONFLICT (brand, product_line, shade) DO NOTHING;

-- IPS Empress Direct - additional shades (BL-L, Opal)
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Ivoclar', 'IPS Empress Direct', 'BL-L', 'Esmalte', 'baixa'),
('Ivoclar', 'IPS Empress Direct', 'Opal', 'Translucido', 'muito_baixa'),
('Ivoclar', 'IPS Empress Direct', 'D BL-L', 'Dentina', 'alta')
ON CONFLICT (brand, product_line, shade) DO NOTHING;

-- IPS Empress Direct Color (corantes)
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Ivoclar', 'IPS Empress Direct Color', 'White', 'Efeito', 'muito_alta'),
('Ivoclar', 'IPS Empress Direct Color', 'Blue', 'Efeito', 'muito_baixa'),
('Ivoclar', 'IPS Empress Direct Color', 'Honey', 'Efeito', 'media'),
('Ivoclar', 'IPS Empress Direct Color', 'Brown', 'Efeito', 'media')
ON CONFLICT (brand, product_line, shade) DO NOTHING;

-- FGM Vittra APS
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('FGM', 'Vittra APS', 'DA1', 'Dentina', 'alta'),
('FGM', 'Vittra APS', 'DA2', 'Dentina', 'alta'),
('FGM', 'Vittra APS', 'DA3', 'Dentina', 'alta'),
('FGM', 'Vittra APS', 'EA1', 'Esmalte', 'baixa'),
('FGM', 'Vittra APS', 'EA2', 'Esmalte', 'baixa'),
('FGM', 'Vittra APS', 'T-Neutral', 'Translucido', 'muito_baixa'),
('FGM', 'Vittra APS', 'Trans', 'Translucido', 'muito_baixa'),
('FGM', 'Vittra APS', 'INC', 'Esmalte', 'baixa'),
('FGM', 'Vittra APS', 'A1', 'Universal', 'media'),
('FGM', 'Vittra APS', 'A2', 'Universal', 'media'),
('FGM', 'Vittra APS', 'A3', 'Universal', 'media')
ON CONFLICT (brand, product_line, shade) DO NOTHING;

-- FGM Opallis Flow (translucidos para efeitos)
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('FGM', 'Opallis Flow', 'Trans', 'Translucido', 'muito_baixa'),
('FGM', 'Opallis Flow', 'A1', 'Universal', 'media'),
('FGM', 'Opallis Flow', 'A2', 'Universal', 'media'),
('FGM', 'Opallis Flow', 'Opal', 'Efeito', 'muito_baixa')
ON CONFLICT (brand, product_line, shade) DO NOTHING;

-- Kerr Kolor+ Plus (corantes para efeitos)
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Kerr', 'Kolor+ Plus', 'White', 'Efeito', 'muito_alta'),
('Kerr', 'Kolor+ Plus', 'Amber', 'Efeito', 'media')
ON CONFLICT (brand, product_line, shade) DO NOTHING;

-- Additional Z350 XT shades (BT, YT)
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('3M', 'Filtek Z350 XT', 'BT', 'Translucido', 'muito_baixa'),
('3M', 'Filtek Z350 XT', 'YT', 'Translucido', 'muito_baixa'),
('3M', 'Filtek Z350 XT', 'WB', 'Body', 'media'),
('3M', 'Filtek Z350 XT', 'WE', 'Esmalte', 'baixa'),
('3M', 'Filtek Z350 XT', 'OA1', 'Opaco', 'muito_alta'),
('3M', 'Filtek Z350 XT', 'B1B', 'Body', 'media')
ON CONFLICT (brand, product_line, shade) DO NOTHING;

-- Tokuyama Estelite Bianco (for bleached teeth)
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Tokuyama', 'Estelite Bianco', 'BL1', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Bianco', 'BL2', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Bianco', 'MW', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Bianco', 'WE', 'Esmalte', 'baixa')
ON CONFLICT (brand, product_line, shade) DO NOTHING;
