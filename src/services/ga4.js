/**
 * Google Analytics 4 Data API Service
 * Coleta métricas reais do GA4
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';

/**
 * Busca métricas do GA4 para um projeto
 * @param {string} propertyId - GA4 Property ID (ex: "520935332")
 * @param {number} days - Número de dias para buscar (padrão: 1 - hoje)
 */
export async function fetchGA4Metrics(propertyId, days = 1) {
  try {
    // Validar credenciais
    const credentials = process.env.GA_CREDENTIALS_JSON;
    if (!credentials) {
      throw new Error('GA_CREDENTIALS_JSON não configurado');
    }

    // Inicializar cliente com credenciais
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: JSON.parse(credentials)
    });

    // Calcular datas
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const formatDate = (date) => {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    // Fazer request para GA4 Data API
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
        },
      ],
      dimensions: [
        {
          name: 'date',
        },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'eventCount' }, // Proxy para CTA clicks
      ],
    });

    // Processar resposta
    if (!response.rows || response.rows.length === 0) {
      console.log('[GA4] Nenhum dado disponível ainda');
      return null;
    }

    // Pegar última linha (dados mais recentes)
    const row = response.rows[response.rows.length - 1];
    const metrics = row.metricValues;

    // Extrair valores
    const sessions = parseInt(metrics[0].value) || 0;
    const users = parseInt(metrics[1].value) || 0;
    const bounceRate = parseFloat(metrics[2].value) || 0;
    const avgSessionDuration = parseFloat(metrics[3].value) || 0;
    const eventCount = parseInt(metrics[4].value) || 0;

    // Estimar CTA clicks e conversões (aproximação)
    // TODO: Configurar eventos customizados no GA4 para dados precisos
    const ctaClicks = Math.floor(eventCount * 0.15); // ~15% dos eventos
    const conversions = Math.floor(ctaClicks * 0.2); // ~20% dos cliques convertem
    const conversionRate = sessions > 0 ? ((conversions / sessions) * 100).toFixed(2) : 0;

    return {
      date: formatDate(endDate),
      sessions,
      users,
      bounceRate: (bounceRate * 100).toFixed(2), // Converter para %
      avgSessionDuration: Math.round(avgSessionDuration),
      ctaClicks,
      conversions,
      conversionRate: parseFloat(conversionRate),
    };

  } catch (error) {
    console.error('[GA4] Erro ao buscar métricas:', error.message);
    
    // Se for erro de credenciais, retornar null
    if (error.message.includes('credentials')) {
      return null;
    }
    
    throw error;
  }
}

export default {
  fetchGA4Metrics,
};
