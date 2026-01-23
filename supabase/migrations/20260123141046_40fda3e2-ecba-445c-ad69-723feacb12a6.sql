-- Expandir treatment_type para suportar mais tipos de tratamento
-- Nota: Postgres text columns não têm constraint por padrão, então apenas documentamos os valores válidos

-- Adicionar coluna para armazenar protocolo genérico (implante, coroa, etc.)
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS generic_protocol jsonb DEFAULT NULL;

-- Comentário para documentar os tipos válidos
COMMENT ON COLUMN evaluations.treatment_type IS 'Tipos válidos: resina, porcelana, coroa, implante, extracao, endodontia, encaminhamento';