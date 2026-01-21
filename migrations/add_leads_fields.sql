-- Adicionar novos campos na tabela leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS nome VARCHAR(255),
ADD COLUMN IF NOT EXISTS telefone VARCHAR(50),
ADD COLUMN IF NOT EXISTS sugestao TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Adicionar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_leads_project_created ON leads(project_id, created_at DESC);
