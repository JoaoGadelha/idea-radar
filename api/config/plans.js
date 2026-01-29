/**
 * Configuração de planos do idea-radar
 * 
 * Modelo: Sistema de CRÉDITOS (não mensalidade)
 * - Créditos não expiram
 * - Usuário compra pacotes quando precisa
 * - Ideal para uso pontual (validação de ideias)
 */

import { sql } from '@vercel/postgres';

// Definição dos pacotes de créditos
export const CREDIT_PACKAGES = {
  free: {
    name: 'Free',
    price: { BRL: 0, USD: 0 },
    credits: {
      landingPages: 3,
      analysis: 10,
    },
    stripe: {
      priceId: { BRL: null, USD: null }, // Não tem - é grátis
    },
  },
  starter: {
    name: 'Starter',
    price: { BRL: 29, USD: 9 },
    credits: {
      landingPages: 15,
      analysis: 50,
    },
    stripe: {
      priceId: { 
        BRL: process.env.STRIPE_PRICE_STARTER_BRL,
        USD: process.env.STRIPE_PRICE_STARTER_USD,
      },
    },
  },
  pro: {
    name: 'Pro Pack',
    price: { BRL: 79, USD: 29 },
    credits: {
      landingPages: 50,
      analysis: 200,
    },
    popular: true, // Tag "mais popular"
    stripe: {
      priceId: { 
        BRL: process.env.STRIPE_PRICE_PRO_BRL,
        USD: process.env.STRIPE_PRICE_PRO_USD,
      },
    },
  },
};

// Features por "tier" (baseado na quantidade de créditos comprados historicamente)
export const FEATURE_TIERS = {
  free: {
    maxProjects: 3,
    maxImagesPerLP: 3,
    analytics: false,
    prioritySupport: false,
  },
  paid: { // Qualquer pessoa que já comprou
    maxProjects: 50,
    maxImagesPerLP: 10,
    analytics: true,
    prioritySupport: true,
  },
};

/**
 * Busca os créditos atuais do usuário
 */
export async function getUserCredits(userId) {
  try {
    const result = await sql`
      SELECT 
        lp_credits,
        lp_credits_used,
        analysis_credits,
        analysis_credits_used,
        current_plan,
        (lp_credits - lp_credits_used) as lp_remaining,
        (analysis_credits - analysis_credits_used) as analysis_remaining
      FROM user_credits 
      WHERE user_id = ${userId}
    `;

    if (result.rows.length === 0) {
      // Criar registro com créditos free
      await sql`
        INSERT INTO user_credits (user_id, lp_credits, analysis_credits, current_plan)
        VALUES (${userId}, 3, 10, 'free')
        ON CONFLICT (user_id) DO NOTHING
      `;
      return {
        lpCredits: 3,
        lpUsed: 0,
        lpRemaining: 3,
        analysisCredits: 10,
        analysisUsed: 0,
        analysisRemaining: 10,
        plan: 'free',
        isPaid: false,
      };
    }

    const row = result.rows[0];
    return {
      lpCredits: row.lp_credits,
      lpUsed: row.lp_credits_used,
      lpRemaining: row.lp_remaining,
      analysisCredits: row.analysis_credits,
      analysisUsed: row.analysis_credits_used,
      analysisRemaining: row.analysis_remaining,
      plan: row.current_plan,
      isPaid: row.current_plan !== 'free',
    };
  } catch (error) {
    console.error('[Credits] Error getting user credits:', error);
    // Retorna free como fallback
    return {
      lpCredits: 3,
      lpUsed: 0,
      lpRemaining: 3,
      analysisCredits: 10,
      analysisUsed: 0,
      analysisRemaining: 10,
      plan: 'free',
      isPaid: false,
    };
  }
}

/**
 * Verifica se o usuário pode gerar uma LP
 */
export async function canGenerateLP(userId) {
  const credits = await getUserCredits(userId);
  return {
    allowed: credits.lpRemaining > 0,
    remaining: credits.lpRemaining,
    total: credits.lpCredits,
  };
}

/**
 * Verifica se o usuário pode fazer análise IA
 */
export async function canUseAnalysis(userId) {
  const credits = await getUserCredits(userId);
  return {
    allowed: credits.analysisRemaining > 0,
    remaining: credits.analysisRemaining,
    total: credits.analysisCredits,
  };
}

/**
 * Consome 1 crédito de LP (com transação atômica)
 * Retorna false se não tinha crédito (previne race condition)
 */
export async function consumeLPCredit(userId) {
  try {
    // UPDATE atômico - só consome se tiver crédito disponível
    const result = await sql`
      UPDATE user_credits 
      SET lp_credits_used = lp_credits_used + 1
      WHERE user_id = ${userId}
        AND lp_credits_used < lp_credits
      RETURNING lp_credits, lp_credits_used
    `;
    
    // Se não atualizou nenhuma linha, não tinha crédito
    if (result.rowCount === 0) {
      return { success: false, reason: 'no_credits' };
    }
    
    // Registrar transação
    await sql`
      INSERT INTO credit_transactions (user_id, type, lp_credits_delta, description)
      VALUES (${userId}, 'usage', -1, 'Geração de Landing Page')
    `;
    
    const row = result.rows[0];
    return { 
      success: true, 
      remaining: row.lp_credits - row.lp_credits_used 
    };
  } catch (error) {
    console.error('[Credits] Error consuming LP credit:', error);
    return { success: false, reason: 'error' };
  }
}

/**
 * Consome 1 crédito de análise IA (com transação atômica)
 * Retorna false se não tinha crédito (previne race condition)
 */
export async function consumeAnalysisCredit(userId) {
  try {
    // UPDATE atômico - só consome se tiver crédito disponível
    const result = await sql`
      UPDATE user_credits 
      SET analysis_credits_used = analysis_credits_used + 1
      WHERE user_id = ${userId}
        AND analysis_credits_used < analysis_credits
      RETURNING analysis_credits, analysis_credits_used
    `;
    
    // Se não atualizou nenhuma linha, não tinha crédito
    if (result.rowCount === 0) {
      return { success: false, reason: 'no_credits' };
    }
    
    // Registrar transação
    await sql`
      INSERT INTO credit_transactions (user_id, type, analysis_credits_delta, description)
      VALUES (${userId}, 'usage', -1, 'Análise com IA')
    `;
    
    const row = result.rows[0];
    return { 
      success: true, 
      remaining: row.analysis_credits - row.analysis_credits_used 
    };
  } catch (error) {
    console.error('[Credits] Error consuming analysis credit:', error);
    return { success: false, reason: 'error' };
  }
}

/**
 * Adiciona créditos após compra
 */
export async function addCredits(userId, packageId, stripePaymentId = null) {
  const pkg = CREDIT_PACKAGES[packageId];
  if (!pkg) {
    throw new Error(`Package ${packageId} not found`);
  }

  try {
    // Atualizar créditos
    await sql`
      UPDATE user_credits 
      SET 
        lp_credits = lp_credits + ${pkg.credits.landingPages},
        analysis_credits = analysis_credits + ${pkg.credits.analysis},
        current_plan = ${packageId}
      WHERE user_id = ${userId}
    `;
    
    // Registrar transação
    await sql`
      INSERT INTO credit_transactions (
        user_id, type, lp_credits_delta, analysis_credits_delta, 
        stripe_payment_id, description, metadata
      )
      VALUES (
        ${userId}, 
        'purchase', 
        ${pkg.credits.landingPages}, 
        ${pkg.credits.analysis},
        ${stripePaymentId},
        ${`Compra pacote ${pkg.name}`},
        ${JSON.stringify({ package: packageId, price: pkg.price })}
      )
    `;
    
    return true;
  } catch (error) {
    console.error('[Credits] Error adding credits:', error);
    throw error;
  }
}

/**
 * Retorna features do usuário baseado no tier
 */
export async function getUserFeatures(userId) {
  const credits = await getUserCredits(userId);
  const tier = credits.isPaid ? 'paid' : 'free';
  return {
    ...FEATURE_TIERS[tier],
    credits,
  };
}

// ============================================
// COMPATIBILIDADE COM CÓDIGO ANTIGO
// (Remover depois de migrar planLimiter.js)
// ============================================

export const PLANS = {
  free: {
    name: 'Free',
    features: {
      landingPages: { maxPerDay: 3, maxTotal: 3 },
      projects: { max: 3 },
      images: { aiGeneration: true, maxPerLandingPage: 3 },
      analytics: { enabled: false },
      support: { priority: 'community' },
    },
  },
  pro: {
    name: 'Pro',
    features: {
      landingPages: { maxPerDay: 50, maxTotal: 50 },
      projects: { max: 50 },
      images: { aiGeneration: true, maxPerLandingPage: 10 },
      analytics: { enabled: true, realtime: true },
      support: { priority: 'email' },
    },
  },
  enterprise: {
    name: 'Enterprise',
    features: {
      landingPages: { unlimited: true },
      projects: { unlimited: true },
      images: { aiGeneration: true, unlimited: true },
      analytics: { enabled: true, realtime: true, export: true },
      support: { priority: 'dedicated' },
    },
  },
};

export function getUserPlan(userId) {
  return 'free'; // Compatibilidade - usar getUserCredits() no novo código
}

export function getPlanLimit(planName, feature, limitType) {
  const plan = PLANS[planName];
  if (!plan) return 0;
  return plan.features?.[feature]?.[limitType] ?? 0;
}

export function hasPlanFeature(plan, feature, subfeature) {
  const planConfig = PLANS[plan];
  if (!planConfig) return false;

  const featureConfig = planConfig.features[feature];
  if (!featureConfig) return false;

  if (subfeature) {
    return featureConfig[subfeature] === true || featureConfig.unlimited === true;
  }

  return true;
}

/**
 * Retorna o limite de uma feature
 */
export function getPlanLimit(plan, feature, limitType) {
  const planConfig = PLANS[plan];
  if (!planConfig) return 0;

  const featureConfig = planConfig.features[feature];
  if (!featureConfig) return 0;

  if (featureConfig.unlimited) return Infinity;

  return featureConfig[limitType] || 0;
}
