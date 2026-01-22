import { createGeminiProvider } from '@joaogadelha/ai-providers';
import { createPrompt } from '@joaogadelha/prompt-builder';
import { parseJSON } from '@joaogadelha/response-parser';
import { createRateLimiter, presets } from '@joaogadelha/rate-limiter';
import { authenticateRequest } from '../middleware/auth.js';

// Rate limiters para Gemini 2.5 Flash (grátis)
const dailyLimiter = createRateLimiter({
  ...presets.gemini(),
  window: 24 * 60 * 60 * 1000, // 24h
  max: 1000000, // 1M tokens/dia
});

const perMinuteLimiter = createRateLimiter({
  ...presets.gemini(),
  window: 60 * 1000, // 1 minuto
  max: 15, // 15 RPM
});

const gemini = createGeminiProvider({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
  model: 'gemini-2.0-flash-exp',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authResult = await authenticateRequest(req);

  if (!authResult.authenticated) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: authResult.error,
    });
  }

  const userId = authResult.userId;

  try {

    // VALORES HARDCODED
    const projectData = {
      name: 'RoomGenius',
      description: 'Ferramenta de IA para transformar ambientes com novas decorações'
    };
    const brief = 'Produto: Ferramenta que usa IA para transformar fotos de ambientes (sala, quarto, cozinha) com novas decorações. O usuário envia uma foto do ambiente e escolhe um estilo (minimalista, escandinavo, industrial, etc). A IA gera uma nova imagem mostrando como o ambiente ficaria decorado naquele estilo. Objetivo da landing page: Capturar emails de pessoas interessadas em testar a ferramenta antes do lançamento oficial. Público-alvo: Pessoas que querem reformar/decorar seus ambientes e buscam inspiração visual antes de investir. Tom: Moderno, prático, inspirador.';

    // Verificar rate limits
    await perMinuteLimiter.acquire();
    await dailyLimiter.acquire();

    // Construir prompt estruturado
    const prompt = createPrompt()
      .role('Você é um especialista em copywriting e marketing digital')
      .personality('criativo, persuasivo, objetivo')
      .responsibilities([
        'Criar headlines impactantes que capturam atenção',
        'Escrever descrições claras e persuasivas',
        'Sugerir CTAs que convertem',
        'Adaptar tom e linguagem ao público-alvo',
      ])
      .context(`
        Projeto: ${projectData.name}
        ${projectData.description ? `Descrição: ${projectData.description}` : ''}
        ${brief ? `Brief adicional: ${brief}` : ''}
      `)
      .section('Tarefa', [
        'Gere UMA landing page para este projeto',
        'Foque em conversão e clareza',
        'Use linguagem persuasiva mas não exagerada',
        'Seja criativo e varie a abordagem a cada geração',
      ])
      .section('Formato JSON', [
        'Retorne UM ÚNICO objeto (não array)',
        'O objeto deve ter: headline, subheadline, description, cta_text',
        'headline: máximo 60 caracteres, impactante',
        'subheadline: máximo 100 caracteres, complementa o headline',
        'description: 2-3 parágrafos, máximo 500 caracteres',
        'cta_text: máximo 30 caracteres, ação clara',
      ])
      .rules([
        'NÃO use jargões técnicos desnecessários',
        'NÃO prometa o que o produto não pode entregar',
        'SEMPRE mantenha tom profissional',
        'SEMPRE foque em benefícios, não features',
      ])
      .build();

    // Chamar Gemini
    const response = await gemini.generate(prompt);

    // Extrair JSON da resposta
    const variation = parseJSON(response);

    if (!variation || typeof variation !== 'object') {
      throw new Error('Formato de resposta inválido');
    }

    // Validar estrutura
    const validVariation = {
      id: `temp_${Date.now()}`,
      headline: variation.headline?.slice(0, 60) || 'Título não disponível',
      subheadline: variation.subheadline?.slice(0, 100) || '',
      description: variation.description?.slice(0, 500) || 'Descrição não disponível',
      cta_text: variation.cta_text?.slice(0, 30) || 'Saiba mais',
    };

    return res.status(200).json({
      variation: validVariation,
      metadata: {
        model: 'gemini-2.0-flash-exp',
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Erro ao gerar landing pages:', error);

    if (error.message?.includes('rate limit')) {
      return res.status(429).json({
        error: 'Limite de requisições excedido. Tente novamente em alguns minutos.',
      });
    }

    return res.status(500).json({
      error: 'Erro ao gerar landing pages',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
