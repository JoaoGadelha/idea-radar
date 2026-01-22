-- Adicionar campos de conteúdo estruturado às landing pages
-- Esses campos armazenam o conteúdo gerado pela IA

-- Value proposition (array de benefícios)
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS value_proposition JSONB;

-- How it works (array de steps)
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS how_it_works JSONB;

-- FAQ items (array de {question, answer})
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS faq_items JSONB;

-- CTA section
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS cta_headline TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS cta_subheadline TEXT;

-- Template selection
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS template VARCHAR(50) DEFAULT 'claude';

-- Comentário descrevendo a estrutura esperada dos JSONs
COMMENT ON COLUMN landing_pages.value_proposition IS 'Array de strings com propostas de valor. Ex: ["Benefício 1", "Benefício 2"]';
COMMENT ON COLUMN landing_pages.how_it_works IS 'Array de objetos com steps. Ex: [{"title": "Passo 1", "description": "..."}]';
COMMENT ON COLUMN landing_pages.faq_items IS 'Array de objetos FAQ. Ex: [{"question": "Pergunta?", "answer": "Resposta"}]';
