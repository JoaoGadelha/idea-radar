/**
 * Serviço de limitação baseado em CRÉDITOS
 * 
 * Modelo: Créditos que não expiram (não é mensalidade)
 * - Verifica créditos disponíveis
 * - Consome créditos ao usar features
 */

import { 
  getUserCredits, 
  canGenerateLP, 
  canUseAnalysis,
  consumeLPCredit,
  consumeAnalysisCredit,
  getUserFeatures,
  CREDIT_PACKAGES 
} from '../config/plans.js';

/**
 * Verifica se o usuário pode gerar uma landing page
 * 
 * @param {string} userId - ID do usuário
 * @returns {Promise<{ allowed: boolean, remaining: number, total: number }>}
 */
export async function canGenerateLandingPage(userId) {
  return await canGenerateLP(userId);
}

/**
 * Consome um crédito de landing page
 * Só chame isso DEPOIS de verificar canGenerateLandingPage()
 * 
 * @param {string} userId - ID do usuário
 */
export async function consumeLandingPageSlot(userId) {
  return await consumeLPCredit(userId);
}

/**
 * Verifica se o usuário pode fazer análise IA
 * 
 * @param {string} userId - ID do usuário
 * @returns {Promise<{ allowed: boolean, remaining: number, total: number }>}
 */
export async function canDoAnalysis(userId) {
  return await canUseAnalysis(userId);
}

/**
 * Consome um crédito de análise IA
 * 
 * @param {string} userId - ID do usuário
 */
export async function consumeAnalysisSlot(userId) {
  return await consumeAnalysisCredit(userId);
}

/**
 * Retorna informações de uso/créditos do usuário
 * 
 * @param {string} userId - ID do usuário
 * @returns {Promise<object>}
 */
export async function getUserUsage(userId) {
  const features = await getUserFeatures(userId);
  const credits = features.credits;

  return {
    plan: credits.plan,
    isPaid: credits.isPaid,
    // Formato simplificado para o Header
    credits: {
      lpRemaining: credits.lpRemaining,
      lpTotal: credits.lpCredits,
      lpUsed: credits.lpUsed,
      analysisRemaining: credits.analysisRemaining,
      analysisTotal: credits.analysisCredits,
      analysisUsed: credits.analysisUsed,
    },
    // Formato detalhado para outras telas
    creditsDetail: {
      landingPages: {
        total: credits.lpCredits,
        used: credits.lpUsed,
        remaining: credits.lpRemaining,
        percentage: credits.lpCredits > 0 
          ? Math.round((credits.lpUsed / credits.lpCredits) * 100) 
          : 0,
      },
      analysis: {
        total: credits.analysisCredits,
        used: credits.analysisUsed,
        remaining: credits.analysisRemaining,
        percentage: credits.analysisCredits > 0 
          ? Math.round((credits.analysisUsed / credits.analysisCredits) * 100) 
          : 0,
      },
    },
    features: {
      maxProjects: features.maxProjects,
      maxImagesPerLP: features.maxImagesPerLP,
      analytics: features.analytics,
      prioritySupport: features.prioritySupport,
    },
  };
}

/**
 * Retorna os pacotes disponíveis para compra
 */
export function getAvailablePackages() {
  return CREDIT_PACKAGES;
}

// ============================================
// COMPATIBILIDADE (para não quebrar código existente)
// ============================================

export async function canSaveLandingPage(userId, currentCount) {
  const features = await getUserFeatures(userId);
  return {
    allowed: currentCount < features.maxProjects,
    limit: features.maxProjects,
    current: currentCount,
  };
}

export function resetLimiters() {
  // Não precisa mais - créditos são persistidos no banco
}

