/**
 * API: Webhook do Stripe
 * POST /api/stripe/webhook
 * 
 * SEGURANÇA:
 * - Verifica assinatura do Stripe (STRIPE_WEBHOOK_SECRET)
 * - Sem assinatura válida = 400 (não processa)
 * - Créditos são adicionados baseado no metadata da session
 * - Idempotência: mesmo evento processado 2x não duplica créditos
 */

import Stripe from 'stripe';
import { sql } from '@vercel/postgres';
import { CREDIT_PACKAGES } from '../config/plans.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Vercel requer raw body para verificar assinatura
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper para ler o body como buffer
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // =========================================
  // VERIFICAÇÃO DE ASSINATURA - CRÍTICO!
  // =========================================
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  let rawBody;

  try {
    rawBody = await getRawBody(req);
    
    // Construir e verificar o evento
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    // NUNCA revelar detalhes do erro para possíveis atacantes
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // =========================================
  // PROCESSAR EVENTOS
  // =========================================
  console.log(`[Stripe Webhook] Event received: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      
      // Extrair metadata
      const { userId, packageId, credits_lp, credits_analysis } = session.metadata || {};
      
      if (!userId || !packageId) {
        console.error('[Stripe Webhook] Missing metadata:', session.metadata);
        return res.status(400).json({ error: 'Missing metadata' });
      }

      // Validar que o pacote existe
      if (!CREDIT_PACKAGES[packageId]) {
        console.error('[Stripe Webhook] Invalid package:', packageId);
        return res.status(400).json({ error: 'Invalid package' });
      }

      // Converter créditos
      const lpCredits = parseInt(credits_lp, 10);
      const analysisCredits = parseInt(credits_analysis, 10);

      if (isNaN(lpCredits) || isNaN(analysisCredits)) {
        console.error('[Stripe Webhook] Invalid credits in metadata');
        return res.status(400).json({ error: 'Invalid credits metadata' });
      }

      // =========================================
      // IDEMPOTÊNCIA: Verificar se já processamos
      // =========================================
      const checkoutSessionId = session.id;
      
      const existingTransaction = await sql`
        SELECT id FROM credit_transactions 
        WHERE stripe_checkout_session_id = ${checkoutSessionId}
        LIMIT 1
      `;

      if (existingTransaction.rows.length > 0) {
        console.log(`[Stripe Webhook] Session ${checkoutSessionId} already processed, skipping`);
        return res.status(200).json({ received: true, status: 'already_processed' });
      }

      // =========================================
      // ADICIONAR CRÉDITOS - TRANSAÇÃO ATÔMICA
      // =========================================
      try {
        // Começar transação
        await sql`BEGIN`;

        // 1. Garantir que usuário tem registro em user_credits
        await sql`
          INSERT INTO user_credits (user_id, lp_credits, analysis_credits, current_plan)
          VALUES (${userId}, 0, 0, 'free')
          ON CONFLICT (user_id) DO NOTHING
        `;

        // 2. Adicionar créditos
        await sql`
          UPDATE user_credits
          SET 
            lp_credits = lp_credits + ${lpCredits},
            analysis_credits = analysis_credits + ${analysisCredits},
            current_plan = ${packageId},
            updated_at = NOW()
          WHERE user_id = ${userId}
        `;

        // 3. Registrar transação (idempotência + auditoria)
        await sql`
          INSERT INTO credit_transactions (
            user_id,
            type,
            lp_credits_delta,
            analysis_credits_delta,
            stripe_checkout_session_id,
            description,
            metadata
          ) VALUES (
            ${userId},
            'purchase',
            ${lpCredits},
            ${analysisCredits},
            ${checkoutSessionId},
            ${`Compra pacote ${CREDIT_PACKAGES[packageId].name}`},
            ${JSON.stringify({ 
              package: packageId, 
              amount: session.amount_total / 100,
              currency: session.currency?.toUpperCase() || 'BRL'
            })}
          )
        `;

        // Commit
        await sql`COMMIT`;

        console.log(`[Stripe Webhook] Credits added for user ${userId}: ${lpCredits} LP, ${analysisCredits} analysis`);

      } catch (dbError) {
        // Rollback em caso de erro
        await sql`ROLLBACK`;
        console.error('[Stripe Webhook] Database error:', dbError);
        return res.status(500).json({ error: 'Database error' });
      }

      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.log(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);
      // Não precisamos fazer nada, apenas logar
      break;
    }

    // Adicionar mais eventos conforme necessário
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  // Sempre retornar 200 para o Stripe saber que recebemos
  return res.status(200).json({ received: true });
}
