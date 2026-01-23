/**
 * Configuração de planos do idea-radar
 * 
 * Fácil de expandir quando adicionar billing:
 * - Adicione novos planos aqui
 * - Ajuste limites conforme necessário
 * - Adicione novas features (analytics, integrations, etc)
 */

export const PLANS = {
  free: {
    name: 'Free',
    features: {
      landingPages: {
        maxPerDay: 5,
        maxTotal: 10, // Máximo de LPs salvas
      },
      projects: {
        max: 3,
      },
      images: {
        aiGeneration: true,
        maxPerLandingPage: 3, // hero + about + product
      },
      analytics: {
        enabled: false, // Futuro: dashboards básicos
      },
      support: {
        priority: 'community', // email/discord
      },
    },
  },

  // Futuro: plano pago
  pro: {
    name: 'Pro',
    features: {
      landingPages: {
        maxPerDay: 50,
        maxTotal: 100,
      },
      projects: {
        max: 50,
      },
      images: {
        aiGeneration: true,
        maxPerLandingPage: 10, // Mais variações
      },
      analytics: {
        enabled: true,
        realtime: true,
      },
      support: {
        priority: 'email',
      },
    },
  },

  // Futuro: plano enterprise
  enterprise: {
    name: 'Enterprise',
    features: {
      landingPages: {
        unlimited: true,
      },
      projects: {
        unlimited: true,
      },
      images: {
        aiGeneration: true,
        unlimited: true,
      },
      analytics: {
        enabled: true,
        realtime: true,
        export: true,
        customReports: true,
      },
      support: {
        priority: 'dedicated',
      },
    },
  },
};

/**
 * Retorna o plano de um usuário
 * Por enquanto todos são free, mas no futuro consulta o DB
 */
export function getUserPlan(userId) {
  // TODO: Quando implementar billing, buscar do DB
  // const user = await db.users.findUnique({ where: { id: userId } });
  // return user.plan || 'free';
  
  return 'free';
}

/**
 * Verifica se o plano tem uma feature específica
 */
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
