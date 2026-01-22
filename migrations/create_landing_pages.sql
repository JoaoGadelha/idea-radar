-- Criar tabela de landing pages
CREATE TABLE IF NOT EXISTS landing_pages (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Identificação
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  
  -- Conteúdo
  headline TEXT NOT NULL,
  subheadline TEXT,
  description TEXT NOT NULL,
  cta_text VARCHAR(100) NOT NULL DEFAULT 'Quero ser notificado!',
  
  -- Design/Customização
  primary_color VARCHAR(7) DEFAULT '#667eea',
  logo_url TEXT,
  hero_image_url TEXT,
  
  -- Configurações
  collect_name BOOLEAN DEFAULT TRUE,
  collect_phone BOOLEAN DEFAULT FALSE,
  collect_suggestions BOOLEAN DEFAULT TRUE,
  thank_you_message TEXT DEFAULT 'Obrigado! Entraremos em contato em breve.',
  
  -- Tracking
  ga4_measurement_id VARCHAR(50),
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at TIMESTAMP,
  
  -- Meta
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_landing_pages_user ON landing_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_project ON landing_pages(project_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON landing_pages(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_landing_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER landing_pages_updated_at
  BEFORE UPDATE ON landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_pages_updated_at();
