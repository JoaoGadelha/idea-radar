-- Migration: Índice único para idempotência de webhooks Stripe
-- Garante que o mesmo checkout session não pode ser processado duas vezes

-- Índice único para stripe_checkout_session_id (somente quando não é NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_stripe_session_unique 
ON credit_transactions(stripe_checkout_session_id) 
WHERE stripe_checkout_session_id IS NOT NULL;

-- Comentário explicativo
COMMENT ON INDEX idx_credit_transactions_stripe_session_unique IS 
'Garante idempotência: mesmo checkout session do Stripe não pode ser processado 2x';
