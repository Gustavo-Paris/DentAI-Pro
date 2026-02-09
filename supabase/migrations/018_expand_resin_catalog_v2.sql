-- 018: Expand resin catalog v2
-- Adds: Estelite Bianco (W shades), Estelite Omega (expanded), Palfique LX5 (expanded),
--        IPS Empress Direct (BL-XL), Adhesive systems

-- Tokuyama Estelite Bianco — W shades (white)
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Tokuyama', 'Estelite Bianco', 'W1', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Bianco', 'W2', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Bianco', 'W3', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Bianco', 'W4', 'Esmalte', 'baixa')
ON CONFLICT (brand, product_line, shade) DO NOTHING;

-- Tokuyama Estelite Omega — additional shades
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Tokuyama', 'Estelite Omega', 'EA1', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Omega', 'EA2', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Omega', 'EA3', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Omega', 'EB1', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Omega', 'DA3', 'Dentina', 'alta'),
('Tokuyama', 'Estelite Omega', 'BL1', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Omega', 'BL2', 'Esmalte', 'baixa'),
('Tokuyama', 'Estelite Omega', 'TRANS', 'Translucido', 'muito_baixa')
ON CONFLICT (brand, product_line, shade) DO NOTHING;

-- Tokuyama Palfique LX5 — additional shades
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Tokuyama', 'Palfique LX5', 'OA1', 'Opaco', 'muito_alta'),
('Tokuyama', 'Palfique LX5', 'OA2', 'Opaco', 'muito_alta'),
('Tokuyama', 'Palfique LX5', 'OA3', 'Opaco', 'muito_alta'),
('Tokuyama', 'Palfique LX5', 'A3.5', 'Universal', 'media'),
('Tokuyama', 'Palfique LX5', 'WB', 'Body', 'media')
ON CONFLICT (brand, product_line, shade) DO NOTHING;

-- Ivoclar IPS Empress Direct — BL-XL shades
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('Ivoclar', 'IPS Empress Direct', 'BL-XL Enamel', 'Esmalte', 'baixa'),
('Ivoclar', 'IPS Empress Direct', 'BL-XL Dentin', 'Dentina', 'alta')
ON CONFLICT (brand, product_line, shade) DO NOTHING;

-- Adhesive systems (type = 'Adesivo')
INSERT INTO public.resin_catalog (brand, product_line, shade, type, opacity) VALUES
('3M', 'Single Bond Universal', 'Universal', 'Adesivo', 'media'),
('Ivoclar', 'Tetric N-Bond Universal', 'Universal', 'Adesivo', 'media'),
('Kuraray', 'Clearfil SE Bond', 'Autocondicionante', 'Adesivo', 'media'),
('Kerr', 'Optibond FL', 'Convencional 3 passos', 'Adesivo', 'media'),
('FGM', 'Ambar Universal APS', 'Universal', 'Adesivo', 'media')
ON CONFLICT (brand, product_line, shade) DO NOTHING;
