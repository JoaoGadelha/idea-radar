import { createGeminiProvider, ASPECT_RATIOS } from '@joaogadelha/ai-providers';
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
    // Receber dados do request
    const { projectData, brief, generateHeroImage = false } = req.body;

    console.log('🎨 [Generate] generateHeroImage flag:', generateHeroImage);

    if (!projectData || !brief) {
      return res.status(400).json({
        error: 'Missing required fields: projectData and brief',
      });
    }

    // Verificar rate limits
    await perMinuteLimiter.acquire();
    await dailyLimiter.acquire();

    // Criar provider NOVO para cada request (evita contexto entre chamadas)
    const gemini = createGeminiProvider({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
      model: 'gemini-2.0-flash-exp',
    });

    // Limpar histórico antes de usar (garantia extra)
    gemini.clearHistory();

    // Prompt profissional inspirado em landing pages de alta conversão
    const prompt = createPrompt()
      .role('Você é um copywriter sênior especializado em landing pages de alta conversão')
      .personality('estratégico, persuasivo, empático com o usuário, focado em resultados')
      .responsibilities([
        'Criar copy que conecta emocionalmente com a dor/desejo do usuário',
        'Estruturar argumentos de forma progressiva (AIDA: Atenção, Interesse, Desejo, Ação)',
        'Usar gatilhos mentais sutis e éticos (escassez, prova social, autoridade)',
        'Antecipar e resolver objeções antes que o usuário as levante',
      ])
      .section('CONTEXTO CRÍTICO', [
        `⚠️ ATENÇÃO: NOVA SOLICITAÇÃO (ID: ${Date.now()})`,
        '',
        '## REGRA CRÍTICA: RESET TOTAL DE CONTEXTO',
        '- Esqueça COMPLETAMENTE qualquer projeto ou briefing anterior',
        '- Esta é uma solicitação TOTALMENTE NOVA e INDEPENDENTE',
        '- NÃO reutilize nenhum conteúdo de respostas anteriores',
        '- NÃO faça suposições baseadas em padrões de projetos passados',
        '- Leia o briefing abaixo como se fosse a primeira vez que está vendo',
        '',
        '## SOBRE ESTE PRODUTO ESPECÍFICO',
        `Nome do Produto: ${projectData.name}`,
        projectData.description ? `Descrição: ${projectData.description}` : '',
        '',
        '## BRIEFING COMPLETO DO CLIENTE',
        brief || 'Produto digital inovador',
        '',
        '## CONTEXTO DA LANDING PAGE',
        'Esta é uma landing page de PRÉ-LANÇAMENTO para VALIDAR a ideia.',
        'O produto ainda não existe - queremos medir interesse real do mercado.',
        'O objetivo é capturar emails de early adopters genuinamente interessados.',
        '',
        '## VALIDAÇÃO OBRIGATÓRIA ANTES DE RESPONDER',
        'Antes de gerar qualquer texto, confirme mentalmente:',
        `1. O produto é sobre: ${projectData.name}`,
        `2. O conceito principal é: ${brief.substring(0, 100)}...`,
        '3. NÃO É SOBRE: fotos, design de interiores, moda, looks, imagens, ou qualquer outro tópico',
        '4. Se o briefing mencionar "cachorros", DEVE ser sobre cachorros',
        '5. Se o briefing mencionar "habilidades", DEVE ser sobre troca de habilidades',
        '',
        'Se você está pensando em gerar algo que NÃO está relacionado ao briefing acima, PARE e releia.',
      ])
      .section('HERO SECTION - Primeira Impressão', [
        'Esta é a seção mais importante. O usuário decide em 3 segundos se fica ou sai.',
        '',
        'headline: Use uma das fórmulas comprovadas:',
        '  - "[Resultado desejado] sem [dor/obstáculo comum]"',
        '  - "O jeito mais [adjetivo] de [benefício principal]"',
        '  - "Para [público] que querem [resultado] em [tempo/facilidade]"',
        '  LIMITE: 60 caracteres. Seja específico, não genérico.',
        '',
        'subheadline: Expanda a promessa do headline.',
        '  - Explique O QUE é e COMO funciona em uma frase.',
        '  - Adicione credibilidade se possível.',
        '  LIMITE: 120 caracteres.',
        '',
        'value_proposition: 3 benefícios TRANSFORMACIONAIS (não features).',
        '  - Foque no RESULTADO que o usuário terá, não no que o produto faz.',
        '  - Use linguagem do usuário, não jargões técnicos.',
        '  - Exemplo ruim: "IA avançada" | Exemplo bom: "Visualize antes de gastar"',
        '',
        'cta_text: Verbo de ação + benefício implícito.',
        '  - Evite "Cadastrar" ou "Enviar". Use "Quero testar primeiro", "Garantir meu acesso".',
        '  LIMITE: 25 caracteres.',
        '',
        'hero_image_prompt: Descrição para gerar uma imagem que representa o RESULTADO.',
        '  - Mostre o "depois", não o "antes".',
        '  - Deve ser aspiracional mas realista.',
        '  - Inclua pessoas felizes usando/aproveitando o resultado se fizer sentido.',
        '  - Seja específico: cores, cenário, estilo visual.',
      ])
      .section('COMO FUNCIONA - Simplicidade', [
        'Mostre que é FÁCIL. O usuário tem medo de complexidade.',
        '',
        'how_it_works: EXATAMENTE 3 passos simples.',
        '  - Cada passo deve ter: icon (emoji), title (máx 30 chars), description (máx 80 chars)',
        '  - Passo 1: O que o usuário FAZ primeiro (ação simples)',
        '  - Passo 2: O que o PRODUTO faz (mágica acontece)',
        '  - Passo 3: O RESULTADO que o usuário obtém (transformação)',
        '',
        'Exemplo de estrutura:',
        '  1. "Envie sua foto" - ação do usuário',
        '  2. "IA transforma" - produto trabalha',
        '  3. "Veja o resultado" - benefício entregue',
      ])
      .section('FAQ - Eliminar Objeções', [
        'Cada pergunta deve atacar uma objeção ou medo comum.',
        '',
        'faq_items: 4-5 perguntas estratégicas:',
        '  1. Sobre PREÇO/CUSTO: "É grátis? Quanto vai custar?"',
        '  2. Sobre FACILIDADE: "Preciso de conhecimento técnico?"',
        '  3. Sobre TEMPO: "Quanto tempo demora para ver resultados?"',
        '  4. Sobre CONFIANÇA: "Por que devo confiar nisso?"',
        '  5. Sobre DISPONIBILIDADE: "Quando vai estar disponível?"',
        '',
        'Respostas devem ser:',
        '  - Honestas (é pré-lançamento, não prometa demais)',
        '  - Curtas (máx 2 frases)',
        '  - Que reforcem benefícios sutilmente',
      ])
      .section('CTA FINAL - Urgência Ética', [
        'Último empurrão para conversão.',
        '',
        'cta_headline: Crie senso de oportunidade, não pressão.',
        '  - "Seja um dos primeiros a experimentar"',
        '  - "Garanta seu lugar na lista de espera"',
        '  - NÃO use: "ÚLTIMA CHANCE", "OFERTA LIMITADA" (fake urgency)',
        '',
        'cta_subheadline: Reduza o risco percebido.',
        '  - "Sem compromisso. Avisamos quando estiver pronto."',
        '  - "Só precisa do email. Sem spam, prometemos."',
      ])
      .section('FORMATO JSON OBRIGATÓRIO', [
        'Retorne APENAS um objeto JSON válido:',
        '{',
        '  "headline": "string (máx 60 chars)",',
        '  "subheadline": "string (máx 120 chars)",',
        '  "value_proposition": ["benefício 1", "benefício 2", "benefício 3"],',
        '  "cta_text": "string (máx 25 chars)",',
        '  "hero_image_prompt": "descrição detalhada para gerar imagem hero",',
        '  "how_it_works": [',
        '    { "icon": "📸", "title": "string", "description": "string" },',
        '    { "icon": "✨", "title": "string", "description": "string" },',
        '    { "icon": "🎉", "title": "string", "description": "string" }',
        '  ],',
        '  "faq_items": [',
        '    { "question": "Pergunta?", "answer": "Resposta." }',
        '  ],',
        '  "cta_headline": "string",',
        '  "cta_subheadline": "string"',
        '}',
      ])
      .rules([
        'ESCREVA EM PORTUGUÊS DO BRASIL',
        'Use linguagem conversacional, como se falasse com um amigo',
        'Seja específico - evite generalidades como "o melhor", "revolucionário"',
        'Mantenha promessas realistas - é um pré-lançamento',
        'Foque em 1 benefício principal, não tente cobrir tudo',
      ])
      .build();

    // Chamar Gemini para gerar copy
    const response = await gemini.generate(prompt);

    // Extrair JSON da resposta
    const variation = parseJSON(response);

    if (!variation || typeof variation !== 'object') {
      throw new Error('Formato de resposta inválido');
    }

    // Gerar hero image com Gemini se solicitado
    let heroImageBase64 = null;
    
    console.log('🎨 [Debug] Verificando geração de imagem:', {
      generateHeroImage,
      hasPrompt: !!variation.hero_image_prompt,
      prompt: variation.hero_image_prompt?.substring(0, 100)
    });
    
    if (generateHeroImage && variation.hero_image_prompt) {
      try {
        console.log('🖼️ [Generate] Gerando hero image com IA...');
        
        // Criar provider de imagem
        const geminiImage = createGeminiProvider({
          apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
          model: 'gemini-2.0-flash-exp', // modelo de texto
          // imageModel usa o padrão: 'gemini-2.5-flash-image' (barato e rápido)
        });

        // Prompt otimizado para hero de landing page
        const imagePrompt = `
          Professional hero image for a landing page.
          ${variation.hero_image_prompt}
          
          Style requirements:
          - Modern, clean, professional aesthetic
          - Bright, optimistic lighting
          - High-quality, polished look
          - Suitable for a tech/SaaS landing page
          - No text, logos, or watermarks
          - Landscape composition
          - Vibrant but not oversaturated colors
        `.trim();

        const imageResult = await geminiImage.generateImage(imagePrompt);
        // Nota: aspectRatio não é suportado pelo imagen-3.0-generate-001
        
        heroImageBase64 = `data:${imageResult.mimeType};base64,${imageResult.data}`;
        console.log('✅ [Generate] Hero image gerada com sucesso:', {
          mimeType: imageResult.mimeType,
          sizeKB: Math.round(imageResult.data.length / 1024),
          preview: heroImageBase64.substring(0, 50) + '...'
        });
      } catch (imageError) {
        console.error('❌ [Generate] Erro ao gerar hero image:', {
          message: imageError.message,
          stack: imageError.stack?.split('\n')[0]
        });
        // Continua sem imagem se falhar
      }
    } else {
      console.log('⏭️ [Generate] Pulando geração de imagem:', {
        generateHeroImage,
        hasPrompt: !!variation.hero_image_prompt
      });
    }

    // Validar e normalizar estrutura completa
    const validVariation = {
      id: `temp_${Date.now()}`,
      // Hero Section
      headline: variation.headline?.slice(0, 60) || 'Título não disponível',
      subheadline: variation.subheadline?.slice(0, 120) || '',
      value_proposition: Array.isArray(variation.value_proposition) 
        ? variation.value_proposition.slice(0, 3) 
        : ['Benefício 1', 'Benefício 2', 'Benefício 3'],
      cta_text: variation.cta_text?.slice(0, 25) || 'Quero testar',
      hero_image: heroImageBase64,
      // Como Funciona
      how_it_works: Array.isArray(variation.how_it_works)
        ? variation.how_it_works.slice(0, 3).map((step, idx) => ({
            icon: step.icon || ['📸', '✨', '🎉'][idx] || '✓',
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
      cta_headline: variation.cta_headline || 'Seja um dos primeiros',
      cta_subheadline: variation.cta_subheadline || 'Cadastre-se e avisamos quando estiver pronto',
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
