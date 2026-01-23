-- Adicionar coluna para tipo de tratamento (resina ou porcelana)
ALTER TABLE evaluations 
ADD COLUMN treatment_type text DEFAULT 'resina';

-- Adicionar coluna para formato de dente desejado (para DSD)
ALTER TABLE evaluations 
ADD COLUMN desired_tooth_shape text;

-- Adicionar coluna para protocolo de cimentação (porcelana)
ALTER TABLE evaluations 
ADD COLUMN cementation_protocol jsonb;

-- Adicionar coluna para indicação da IA (porcelana vs resina)
ALTER TABLE evaluations 
ADD COLUMN ai_treatment_indication text;

-- Adicionar coluna para razão da indicação
ALTER TABLE evaluations 
ADD COLUMN ai_indication_reason text;

-- Comentários para documentação
COMMENT ON COLUMN evaluations.treatment_type IS 'Tipo de tratamento: resina ou porcelana';
COMMENT ON COLUMN evaluations.desired_tooth_shape IS 'Formato desejado: natural, quadrado, triangular, oval, retangular';
COMMENT ON COLUMN evaluations.cementation_protocol IS 'Protocolo de cimentação para facetas de porcelana';
COMMENT ON COLUMN evaluations.ai_treatment_indication IS 'Indicação da IA: resina ou porcelana';
COMMENT ON COLUMN evaluations.ai_indication_reason IS 'Razão da indicação de tratamento pela IA';