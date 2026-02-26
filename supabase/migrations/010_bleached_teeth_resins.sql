-- Add bleached teeth resins to catalog (if not already present)
-- These resins are specifically designed for patients with bleached/whitened teeth

INSERT INTO resins (name, manufacturer, type, indications, opacity, resistance, polishing, aesthetics, price_range, description)
SELECT 'IPS Empress Direct BL-L', 'Ivoclar Vivadent', 'Nano-híbrida', ARRAY['Anterior', 'Dentes clareados'], 'Translúcido', 'Média', 'Excelente', 'Excelente', 'Premium', 'Esmalte translúcido para dentes clareados - linha Empress Direct'
WHERE NOT EXISTS (SELECT 1 FROM resins WHERE name = 'IPS Empress Direct BL-L' AND manufacturer = 'Ivoclar Vivadent');

INSERT INTO resins (name, manufacturer, type, indications, opacity, resistance, polishing, aesthetics, price_range, description)
SELECT 'Estelite Sigma Quick Bianco', 'Tokuyama', 'Supra-nano esférica', ARRAY['Anterior', 'Dentes clareados'], 'Translúcido', 'Alta', 'Excelente', 'Excelente', 'Premium', 'Esmalte para dentes clareados - efeito branqueado natural'
WHERE NOT EXISTS (SELECT 1 FROM resins WHERE name = 'Estelite Sigma Quick Bianco' AND manufacturer = 'Tokuyama');

INSERT INTO resins (name, manufacturer, type, indications, opacity, resistance, polishing, aesthetics, price_range, description)
SELECT 'Palfique LX5 WE', 'Tokuyama', 'Supra-nano esférica', ARRAY['Anterior', 'Dentes clareados'], 'Translúcido', 'Alta', 'Excelente', 'Excelente', 'Premium', 'White Enamel para dentes clareados - polimento espelhado'
WHERE NOT EXISTS (SELECT 1 FROM resins WHERE name = 'Palfique LX5 WE' AND manufacturer = 'Tokuyama');

INSERT INTO resins (name, manufacturer, type, indications, opacity, resistance, polishing, aesthetics, price_range, description)
SELECT 'Estelite Sigma Quick MW', 'Tokuyama', 'Supra-nano esférica', ARRAY['Anterior', 'Dentes clareados'], 'Semi-Translúcido', 'Alta', 'Excelente', 'Excelente', 'Premium', 'Milky White - esmalte semi-translúcido para dentes clareados'
WHERE NOT EXISTS (SELECT 1 FROM resins WHERE name = 'Estelite Sigma Quick MW' AND manufacturer = 'Tokuyama');
