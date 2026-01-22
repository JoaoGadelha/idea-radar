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
      .role('Você é um especialista em copywriting e marketing digital para landing pages de validação de ideias')
      .personality('criativo, persuasivo, objetivo, focado em conversão')
      .responsibilities([
        'Criar headlines impactantes que capturam atenção',
        'Escrever copy clara e persuasiva',
        'Desenvolver CTAs que convertem',
        'Estruturar seções de landing page de alta conversão',
      ])
      .context(`
        Projeto: ${projectData.name}
        ${projectData.description ? `Descrição: ${projectData.description}` : ''}
        ${brief ? `Ideia do produto/serviço: ${brief}` : ''}
        
        IMPORTANTE: Esta é uma landing page para VALIDAR a ideia antes de desenvolver o produto.
        O objetivo é capturar emails de interessados e termometrar o mercado.
      `)
      .section('Estrutura da Landing Page', [
        'A landing page deve ter as seguintes seções:',
        '',
        '1. HERO SECTION (acima da dobra):',
        '   - headline: Título principal (máx 60 caracteres, impactante)',
        '   - subheadline: Complemento do título (máx 100 caracteres)',
        '   - value_proposition: 3 benefícios principais em formato de lista',
        '   - cta_text: Texto do botão principal (ex: "Quero ser notificado", "Garantir acesso")',
        '',
        '2. COMO FUNCIONA (explicar o produto):',
        '   - how_it_works: Array com 3 passos simples de como o produto funciona',
        '   - Cada passo deve ter: título curto e descrição breve',
        '',
        '3. FAQ (responder objeções):',
        '   - faq_items: Array com 4-5 perguntas frequentes',
        '   - Cada item: pergunta e resposta que antecipa dúvidas/objeções',
        '',
        '4. CTA FINAL (conversão):',
        '   - cta_headline: Título da seção final (urgência/ação)',
        '   - cta_subheadline: Reforço do valor',
      ])
      .section('Formato JSON Obrigatório', [
        'Retorne UM objeto JSON com EXATAMENTE esta estrutura:',
        '{',
        '  "headline": "string (máx 60 chars)",',
        '  "subheadline": "string (máx 100 chars)",',
        '  "value_proposition": ["benefício 1", "benefício 2", "benefício 3"],',
        '  "cta_text": "string (máx 30 chars)",',
        '  "how_it_works": [',
        '    { "title": "Passo 1", "description": "Descrição curta" },',
        '    { "title": "Passo 2", "description": "Descrição curta" },',
        '    { "title": "Passo 3", "description": "Descrição curta" }',
        '  ],',
        '  "faq_items": [',
        '    { "question": "Pergunta?", "answer": "Resposta clara" }',
        '  ],',
        '  "cta_headline": "Chamada final para ação",',
        '  "cta_subheadline": "Reforço do benefício"',
        '}',
      ])
      .rules([
        'NÃO use jargões técnicos desnecessários',
        'NÃO prometa o que o produto não pode entregar',
        'SEMPRE mantenha tom profissional e inspirador',
        'SEMPRE foque em benefícios claros e tangíveis',
        'Use linguagem que gera urgência mas sem pressão excessiva',
        'FAQ deve antecipar e resolver objeções comuns',
      ])
      .build();

    // Chamar Gemini
    const response = await gemini.generate(prompt);

    // Extrair JSON da resposta
    const variation = parseJSON(response);

    if (!variation || typeof variation !== 'object') {
      throw new Error('Formato de resposta inválido');
    }

    // Validar e normalizar estrutura completa
    const validVariation = {
      id: `temp_${Date.now()}`,
      // Hero Section
      headline: variation.headline?.slice(0, 60) || 'Título não disponível',
      subheadline: variation.subheadline?.slice(0, 100) || '',
      value_proposition: Array.isArray(variation.value_proposition) 
        ? variation.value_proposition.slice(0, 3) 
        : ['Benefício 1', 'Benefício 2', 'Benefício 3'],
      cta_text: variation.cta_text?.slice(0, 30) || 'Quero ser notificado',
      // Como Funciona
      how_it_works: Array.isArray(variation.how_it_works)
        ? variation.how_it_works.slice(0, 3).map(step => ({
            title: step.title || 'Passo',
            description: step.description || ''
          }))
        : [],
      // FAQ
      faq_items: Array.isArray(variation.faq_items)
        ? variation.faq_items.slice(0, 5).map(item => ({
            question: item.question || '',
            answer: item.answer || ''
          }))
        : [],
      // CTA Final
      cta_headline: variation.cta_headline || 'Pronto para começar?',
      cta_subheadline: variation.cta_subheadline || 'Cadastre-se e seja avisado quando lançarmos',
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
