/**
 * LLM Service - IdeaRadar
 * 
 * Refatorado para usar ai-toolkit
 * Usa Google Gemini 2.5 Flash para análise de métricas e projetos
 */

import { createGeminiProvider } from '@joaogadelha/ai-providers';
import { createRateLimiter, presets } from '@joaogadelha/rate-limiter';

// Configuração
const DISABLE_GEMINI = process.env.DISABLE_GEMINI === 'true';
const GEMINI_MAX_CALLS_PER_DAY = parseInt(process.env.GEMINI_MAX_CALLS_PER_DAY || '1500', 10);

// Rate limiter - combina limite diário + limite por minuto do Gemini
const dailyLimiter = createRateLimiter({
  strategy: 'fixed-window',
  maxRequests: GEMINI_MAX_CALLS_PER_DAY,
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  throwOnLimit: true
});

const minuteLimiter = presets.gemini(); // 60 RPM do Gemini Free Tier

/**
 * Chama o modelo Gemini com um prompt
 * @param {string} prompt - Prompt a ser enviado
 * @param {Object} options - Opções adicionais
 * @param {string} options.model - Modelo a ser usado (default: gemini-2.5-flash)
 * @param {number} options.temperature - Temperatura (0-2, default: 0.7)
 * @param {number} options.maxTokens - Máximo de tokens na resposta
 * @param {boolean} options.json - Se deve retornar JSON estruturado
 * @returns {Promise<string>} Resposta do modelo
 */
export async function callLLM(prompt, options = {}) {
  if (DISABLE_GEMINI) {
    throw new Error('Gemini is disabled via DISABLE_GEMINI');
  }

  const {
    model = 'gemini-2.5-flash',
    temperature = 0.7,
    maxTokens = 4000,
    json = false,
  } = options;

  try {
    // Aplicar rate limiting
    await dailyLimiter.acquire();
    await minuteLimiter.acquire();

    // Criar provider Gemini
    const provider = createGeminiProvider({
      apiKey: process.env.GOOGLE_AI_API_KEY || '',
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens, // Gemini usa maxOutputTokens, não maxTokens
      }
    });

    // Adicionar instrução para JSON se necessário
    let finalPrompt = prompt;
    if (json) {
      finalPrompt = `${prompt}\n\nIMPORTANTE: Responda APENAS com JSON válido, sem texto adicional antes ou depois.`;
    }

    // Gerar conteúdo com retry automático
    let result;
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await provider.generate(finalPrompt);
        break;
      } catch (error) {
        lastError = error;
        const isRetryable = 
          error.message?.includes('429') || // Rate limit
          error.message?.includes('500') || // Server error
          error.message?.includes('503') || // Service unavailable
          error.message?.includes('timeout') ||
          error.message?.includes('ECONNRESET') ||
          error.message?.includes('network');
        
        if (attempt === maxRetries || !isRetryable) {
          throw error;
        }
        
        // Espera exponencial: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`[LLM] Tentativa ${attempt} falhou, retrying em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (!result) {
      throw lastError || new Error('Failed to get response after retries');
    }

    return result;
  } catch (error) {
    console.error('[LLM Error]', error.message);
    
    // Mensagem mais amigável para limite diário
    if (error.message?.includes('Rate limit exceeded')) {
      throw new Error('Gemini daily limit reached. Try again tomorrow.');
    }
    
    throw new Error(`LLM call failed: ${error.message}`);
  }
}

/**
 * Chama o modelo com fallback automático
 * Tenta gemini-2.5-flash primeiro, depois gemini-1.5-flash se falhar
 */
export async function callLLMWithFallback(prompt, options = {}) {
  try {
    return await callLLM(prompt, { ...options, model: 'gemini-2.5-flash' });
  } catch (error) {
    console.warn('[LLM] gemini-2.5-flash failed, trying gemini-1.5-flash...');
    return await callLLM(prompt, { ...options, model: 'gemini-1.5-flash' });
  }
}

/**
 * Estima o custo aproximado de uma chamada
 */
export function estimateCost(inputTokens, outputTokens, model = 'gemini-2.5-flash') {
  const pricing = {
    'gemini-2.5-flash': { input: 0.075 / 1_000_000, output: 0.30 / 1_000_000 },
    'gemini-1.5-flash': { input: 0.075 / 1_000_000, output: 0.30 / 1_000_000 },
    'gemini-1.5-pro': { input: 1.25 / 1_000_000, output: 5.00 / 1_000_000 },
  };

  const modelPricing = pricing[model] || pricing['gemini-2.5-flash'];
  return inputTokens * modelPricing.input + outputTokens * modelPricing.output;
}

export default {
  callLLM,
  callLLMWithFallback,
  estimateCost,
};
