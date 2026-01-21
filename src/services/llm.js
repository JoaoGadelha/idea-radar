/**
 * LLM Service - IdeaRadar
 * 
 * Baseado no Alfred - Usa Google Gemini 2.5 Flash
 * para análise de métricas e projetos
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuração do cliente Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const GEMINI_MAX_CALLS_PER_DAY = parseInt(process.env.GEMINI_MAX_CALLS_PER_DAY || '1500', 10);
const DISABLE_GEMINI = process.env.DISABLE_GEMINI === 'true';

// Contador simples de rate limit (em produção, usar Redis ou banco)
let dailyCalls = 0;
let lastReset = Date.now();

function checkDailyLimit() {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  if (now - lastReset > oneDayMs) {
    dailyCalls = 0;
    lastReset = now;
  }
  
  if (dailyCalls >= GEMINI_MAX_CALLS_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }
  
  dailyCalls++;
  return { allowed: true, remaining: GEMINI_MAX_CALLS_PER_DAY - dailyCalls };
}

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
    const limitResult = checkDailyLimit();
    if (!limitResult.allowed) {
      throw new Error('Gemini daily limit reached. Try again tomorrow.');
    }

    // Inicializar o modelo
    const geminiModel = genAI.getGenerativeModel({ 
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    // Adicionar instrução para JSON se necessário
    let finalPrompt = prompt;
    if (json) {
      finalPrompt = `${prompt}\n\nIMPORTANTE: Responda APENAS com JSON válido, sem texto adicional antes ou depois.`;
    }

    // Gerar conteúdo com retry simples
    let result;
    let retries = 2;
    
    while (retries >= 0) {
      try {
        result = await geminiModel.generateContent(finalPrompt);
        break;
      } catch (error) {
        if (retries === 0 || !error.message?.includes('429')) {
          throw error;
        }
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('[LLM Error]', error.message);
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
