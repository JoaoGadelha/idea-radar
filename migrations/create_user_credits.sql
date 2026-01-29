-- Migration: Sistema de Créditos
-- Modelo: Créditos que não expiram (não é mensalidade)

-- Tabela de créditos do usuário
CREATE TABLE IF NOT EXISTS user_credits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Créditos de Landing Pages
  lp_credits INT NOT NULL DEFAULT 3,
  lp_credits_used INT NOT NULL DEFAULT 0,
  
  -- Créditos de Análise IA
  analysis_credits INT NOT NULL DEFAULT 10,
  analysis_credits_used INT NOT NULL DEFAULT 0,
  
  -- Plano atual (para referência, mas créditos são independentes)
  current_plan VARCHAR(50) NOT NULL DEFAULT 'free',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id)
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- Histórico de transações de créditos (para auditoria e Stripe)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Tipo de transação
  type VARCHAR(50) NOT NULL, -- 'purchase', 'usage', 'bonus', 'refund'
  
  -- Créditos afetados
  lp_credits_delta INT DEFAULT 0,
  analysis_credits_delta INT DEFAULT 0,
  
  -- Referência de pagamento (Stripe)
  stripe_payment_id VARCHAR(255),
  stripe_checkout_session_id VARCHAR(255),
  
  -- Detalhes
  description TEXT,
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para histórico do usuário
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe ON credit_transactions(stripe_payment_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_credits_updated_at ON user_credits;
CREATE TRIGGER trigger_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_credits_updated_at();

-- Inserir créditos iniciais para usuários existentes que ainda não têm
INSERT INTO user_credits (user_id, lp_credits, analysis_credits, current_plan)
SELECT id, 3, 10, 'free' FROM users
WHERE id NOT IN (SELECT user_id FROM user_credits)
ON CONFLICT (user_id) DO NOTHING;
