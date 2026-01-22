-- Adicionar coluna session_id para agrupar avaliações da mesma sessão
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS session_id uuid DEFAULT gen_random_uuid();

-- Criar índice para consultas agrupadas por sessão
CREATE INDEX IF NOT EXISTS idx_evaluations_session_id ON evaluations(session_id);