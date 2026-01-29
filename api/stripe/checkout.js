/**
 * API: Criar Checkout Session do Stripe
 * POST /api/stripe/checkout
 * Body: { packageId: string }
 * 
 * SEGURANÇA:
 * - Preços são definidos no BACKEND (nunca confiar no frontend)
 * - PackageId é validado contra lista fixa
 * - Preço vem dos Price IDs do Stripe (imutáveis)
 * - userId é guardado no metadata para o webhook
 */

import Stripe from 'stripe';
import { authenticateRequest } from '../middleware/auth.js';
import { checkMaintenance } from '../middleware/maintenance.js';
import { CREDIT_PACKAGES } from '../config/plans.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Detecta país do usuário para mostrar preço correto
async function detectCurrency(req) {
  // 1. Query param explícito (para testes)
  const queryLang = new URL(req.url, `http://${req.headers.host}`).searchParams.get('currency');
  if (queryLang === 'USD' || queryLang === 'BRL') return queryLang;
  
  // 2. Header de país da Vercel/Cloudflare
  const country = req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'];
  if (country === 'BR') return 'BRL';
  if (country) return 'USD'; // Qualquer outro país = USD
  
  // 3. Fallback para BRL (mercado principal)
  return 'BRL';
}

export default async function handler(req, res) {
  // Bloquear se em modo de manutenção
  const maintenance = checkMaintenance(req, res);
  if (maintenance.blocked) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Autenticação obrigatória
  const authResult = await authenticateRequest(req);
  if (!authResult.authenticated) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: authResult.error,
    });
  }

  const userId = authResult.userId;
  const userEmail = authResult.email;
  const { packageId } = req.body;

  // =========================================
  // VALIDAÇÃO 1: Package existe?
  // =========================================
  if (!packageId || !CREDIT_PACKAGES[packageId]) {
    return res.status(400).json({ 
      error: 'Invalid package',
      message: 'Pacote não encontrado',
      validPackages: Object.keys(CREDIT_PACKAGES).filter(k => k !== 'free'),
    });
  }

  const pkg = CREDIT_PACKAGES[packageId];

  // =========================================
  // VALIDAÇÃO 2: Não pode comprar "free"
  // =========================================
  if (packageId === 'free') {
    return res.status(400).json({ 
      error: 'Invalid package',
      message: 'Pacote gratuito não pode ser comprado',
    });
  }

  // =========================================
  // VALIDAÇÃO 3: Stripe Price ID configurado?
  // =========================================
  const currency = await detectCurrency(req);
  const priceId = pkg.stripe?.priceId?.[currency];

  if (!priceId) {
    console.error(`[Stripe] Price ID not configured for ${packageId} ${currency}`);
    return res.status(500).json({ 
      error: 'Configuration error',
      message: 'Preço não configurado. Entre em contato com o suporte.',
    });
  }

  try {
    // =========================================
    // CRIAR CHECKOUT SESSION
    // - Preço vem do Stripe (Price ID fixo)
    // - Metadata guarda packageId e userId para webhook
    // =========================================
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // Pagamento único (não assinatura)
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price: priceId, // Preço definido no Stripe Dashboard
          quantity: 1,
        },
      ],
      // Metadata - CRÍTICO para o webhook
      metadata: {
        userId: userId,
        packageId: packageId,
        credits_lp: String(pkg.credits.landingPages),
        credits_analysis: String(pkg.credits.analysis),
      },
      // URLs de retorno
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://idea-radar-react.vercel.app'}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://idea-radar-react.vercel.app'}/pricing?payment=cancelled`,
      // Configurações adicionais
      allow_promotion_codes: true, // Permitir cupons
      billing_address_collection: 'auto',
    });

    console.log(`[Stripe] Checkout created: ${session.id} for user ${userId}, package ${packageId}`);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url, // URL para redirecionar o usuário
    });

  } catch (error) {
    console.error('[Stripe] Checkout error:', error);
    return res.status(500).json({
      error: 'Stripe error',
      message: 'Erro ao criar sessão de pagamento. Tente novamente.',
    });
  }
}
