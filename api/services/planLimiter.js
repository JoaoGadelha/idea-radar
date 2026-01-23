/**
 * Serviço de limitação baseado em planos
 * Usa @joaogadelha/rate-limiter do ai-toolkit
 */

import { createMultiKeyRateLimiter } from '@joaogadelha/rate-limiter';
import { PLANS, getUserPlan, getPlanLimit } from '../config/plans.js';

/**
 * Rate limiters por feature
 * Cada feature tem seu próprio limiter configurado
 */
const limiters = {
  landingPages: null, // Inicializado sob demanda
};

/**
 * Cria ou retorna limiter para landing pages
 */
function getLandingPageLimiter() {
  if (!limiters.landingPages) {
    // Usa o maior limite de todos os planos como base
    // Cada usuário terá seu limite checado individualmente
    limiters.landingPages = createMultiKeyRateLimiter({
      strategy: 'fixed-window',
      maxRequests: 100, // Máximo entre todos os planos
      windowMs: 24 * 60 * 60 * 1000, // 24 horas
    });
  }
  return limiters.landingPages;
}

/**
 * Verifica se o usuário pode gerar uma landing page
 * 
 * @param {string} userId - ID do usuário
 * @returns {Promise<{ allowed: boolean, limit: number, remaining: number, waitTime?: number, plan: string }>}
 */
export async function canGenerateLandingPage(userId) {
  const userPlan = getUserPlan(userId);
  const limit = getPlanLimit(userPlan, 'landingPages', 'maxPerDay');

  // Se for unlimited (enterprise)
  if (limit === Infinity) {
    return {
      allowed: true,
      limit: 'unlimited',
      remaining: 'unlimited',
      plan: userPlan,
    };
  }

  const limiter = getLandingPageLimiter();
  const result = limiter.tryAcquire(userId);

  // Calcula quantas requisições já fez hoje
  const status = limiter.getStatus(userId);
  const used = limit - status.remaining;

  // Verifica se excedeu o limite do plano
  if (used >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      waitTime: result.waitTime,
      plan: userPlan,
    };
  }

  // Se pode gerar, adquire o slot
  if (result.allowed) {
    return {
      allowed: true,
      limit,
      remaining: limit - used - 1,
      plan: userPlan,
    };
  }

  return {
    allowed: false,
    limit,
    remaining: 0,
    waitTime: result.waitTime,
    plan: userPlan,
  };
}

/**
 * Consome um slot de geração de landing page
 * Só chame isso DEPOIS de verificar canGenerateLandingPage()
 * 
 * @param {string} userId - ID do usuário
 */
export async function consumeLandingPageSlot(userId) {
  const limiter = getLandingPageLimiter();
  limiter.acquire(userId);
}

/**
 * Verifica quantas landing pages o usuário pode ter salvas
 * 
 * @param {string} userId - ID do usuário
 * @param {number} currentCount - Quantas LPs o usuário já tem
 * @returns {Promise<{ allowed: boolean, limit: number, current: number }>}
 */
export async function canSaveLandingPage(userId, currentCount) {
  const userPlan = getUserPlan(userId);
  const limit = getPlanLimit(userPlan, 'landingPages', 'maxTotal');

  if (limit === Infinity) {
    return {
      allowed: true,
      limit: 'unlimited',
      current: currentCount,
    };
  }

  return {
    allowed: currentCount < limit,
    limit,
    current: currentCount,
  };
}

/**
 * Retorna informações de uso do usuário
 * Útil para mostrar no frontend (progress bars, etc)
 * 
 * @param {string} userId - ID do usuário
 * @returns {Promise<{ plan: string, usage: object }>}
 */
export async function getUserUsage(userId) {
  const userPlan = getUserPlan(userId);
  const limiter = getLandingPageLimiter();
  const status = limiter.getStatus(userId);

  const dailyLimit = getPlanLimit(userPlan, 'landingPages', 'maxPerDay');
  const used = dailyLimit === Infinity ? 0 : dailyLimit - status.remaining;

  return {
    plan: userPlan,
    planName: PLANS[userPlan].name,
    usage: {
      landingPages: {
        daily: {
          used,
          limit: dailyLimit,
          percentage: dailyLimit === Infinity ? 0 : (used / dailyLimit) * 100,
        },
        // TODO: adicionar total quando tiver contador no DB
      },
    },
  };
}

/**
 * Reseta os limitadores (apenas para testes/dev)
 */
export function resetLimiters() {
  Object.keys(limiters).forEach(key => {
    if (limiters[key]) {
      limiters[key].reset();
    }
  });
}
