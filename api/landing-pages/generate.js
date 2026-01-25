import { createGeminiProvider, ASPECT_RATIOS } from '@joaogadelha/ai-providers';
import { createPrompt } from '@joaogadelha/prompt-builder';
import { parseJSON } from '@joaogadelha/response-parser';
import { createRateLimiter, presets } from '@joaogadelha/rate-limiter';
import { authenticateRequest } from '../middleware/auth.js';
import { canGenerateLandingPage, consumeLandingPageSlot } from '../services/planLimiter.js';

// Helper para retry de geração de imagem
async function generateImageWithRetry(geminiImage, prompt, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[IMAGE GENERATION] Tentativa ${attempt}/${maxRetries}`);
      console.log(`[IMAGE GENERATION] Prompt: ${prompt.substring(0, 100)}...`);
      
      const imageResult = await geminiImage.generateImage(prompt);
      
      console.log(`[IMAGE GENERATION] ✅ Sucesso na tentativa ${attempt}`);
      console.log(`[IMAGE GENERATION] MimeType: ${imageResult.mimeType}`);
      console.log(`[IMAGE GENERATION] Data size: ${imageResult.data?.length || 0} chars`);
      
      return `data:${imageResult.mimeType};base64,${imageResult.data}`;
    } catch (error) {
      lastError = error;
      console.error(`[IMAGE GENERATION] ❌ Erro na tentativa ${attempt}:`, error.message);
      console.error(`[IMAGE GENERATION] Stack:`, error.stack);
      
      if (attempt < maxRetries) {
        // Aguardar antes de tentar novamente (exponential backoff)
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[IMAGE GENERATION] ⏳ Aguardando ${delayMs}ms antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  console.error(`[IMAGE GENERATION] ⛔ Falha após ${maxRetries} tentativas:`, lastError?.message);
  console.error(`[IMAGE GENERATION] Final error:`, lastError);
  return null;
}

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
    // Verificar se o usuário pode gerar landing page (rate limit baseado em plano)
    const limitCheck = await canGenerateLandingPage(userId);
    
    if (!limitCheck.allowed) {
      return res.status(429).json({
        error: 'Limite diário atingido',
        message: `Você atingiu o limite de ${limitCheck.limit} landing pages por dia do plano ${limitCheck.plan}.`,
        limit: limitCheck.limit,
        remaining: limitCheck.remaining,
        waitTime: limitCheck.waitTime,
        plan: limitCheck.plan,
        upgradeMessage: limitCheck.plan === 'free' 
          ? 'Faça upgrade para o plano Pro e gere até 50 landing pages por dia!'
          : null,
      });
    }

    // Receber dados do request
    const { 
      projectData, 
      brief, 
      generateHeroImage = false,
      generateAboutImage = false,
      generateProductImage = false,
      regenerateImageOnly = false,
      regenerateAboutImageOnly = false
    } = req.body;

    // Se for apenas regenerar imagem hero, fazer processo simplificado
    if (regenerateImageOnly && generateHeroImage) {
      try {
        
        const geminiImage = createGeminiProvider({
          apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
          model: 'gemini-2.5-flash',
        });

        const imagePrompt = `
          Professional hero image for a landing page in square 1:1 format.
          ${brief}
          
          Style requirements:
          - Square 1:1 aspect ratio
          - Modern, clean, professional aesthetic
          - Bright, optimistic lighting
          - High-quality, polished look
          - Suitable for a tech/SaaS landing page
          - No text, logos, or watermarks
          - Vibrant but not oversaturated colors
        `.trim();

        const imageResult = await geminiImage.generateImage(imagePrompt);
        const heroImageBase64 = `data:${imageResult.mimeType};base64,${imageResult.data}`;
        
        return res.json({
          variation: {
            hero_image: heroImageBase64,
          },
        });
      } catch (error) {
        console.error('Erro ao regenerar imagem hero:', error.message);
        return res.status(500).json({ error: 'Erro ao regenerar imagem hero' });
      }
    }

    // Se for apenas regenerar imagem about, fazer processo simplificado
    if (regenerateAboutImageOnly && generateAboutImage) {
      try {
        
        const geminiImage = createGeminiProvider({
          apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
          model: 'gemini-2.5-flash',
        });

        const imagePrompt = `
          Professional square 1:1 image for an "about/story" section of a landing page.
          ${brief}
          
          Style requirements:
          - Square 1:1 aspect ratio
          - Realistic, authentic scene (no generic symbols or illustrations)
          - Show real people or real situations that the product addresses
          - Contextual to the product's problem space
          - High-quality, professional photography style
          - Natural lighting, relatable environment
          - No text, logos, or watermarks
        `.trim();

        const imageResult = await geminiImage.generateImage(imagePrompt);
        const aboutImageBase64 = `data:${imageResult.mimeType};base64,${imageResult.data}`;
        
        return res.json({
          variation: {
            about_image: aboutImageBase64,
          },
        });
      } catch (error) {
        console.error('Erro ao regenerar imagem about:', error.message);
        return res.status(500).json({ error: 'Erro ao regenerar imagem about' });
      }
    }

    // Se for apenas regenerar imagem product, fazer processo simplificado
    if (req.body.regenerateProductImageOnly && req.body.generateProductImage) {
      try {
        
        const geminiImage = createGeminiProvider({
          apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
          model: 'gemini-2.5-flash',
        });

        const imagePrompt = `
          Professional square 1:1 product visualization for a landing page.
          ${brief}
          
          Style requirements:
          - Square 1:1 aspect ratio
          - Modern product/interface visualization
          - MUST show what the product IS (dashboard, app, marketplace, platform)
          - Clean, professional digital design aesthetic
          - High-quality UI elements if applicable
          - No text labels, logos, or watermarks
          - Modern tech/SaaS color palette
        `.trim();

        const imageResult = await geminiImage.generateImage(imagePrompt);
        const productImageBase64 = `data:${imageResult.mimeType};base64,${imageResult.data}`;
        
        return res.json({
          variation: {
            product_image: productImageBase64,
          },
        });
      } catch (error) {
        console.error('Erro ao regenerar imagem product:', error.message);
        return res.status(500).json({ error: 'Erro ao regenerar imagem product' });
      }
    }

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
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 8192, // Aumentar para garantir resposta completa (JSON grande)
        temperature: 0.7,
      }
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
      .section('SOBRE O PRODUTO - Storytelling e Propósito', [
        'Explique a RAZÃO DE EXISTIR do produto de forma narrativa e emocional.',
        '',
        'about_title: Título que conecta com o problema ou dor.',
        '  - "Por que criamos isso?"',
        '  - "O problema que ninguém resolve"',
        '  - "A história por trás de [produto]"',
        '  LIMITE: 60 caracteres.',
        '',
        'about_paragraphs: 2-3 parágrafos explicando:',
        '  1. A DOR/PROBLEMA que existe (contexto emocional)',
        '  2. Por que soluções atuais FALHAM ou são frustrantes',
        '  3. Como este produto resolve de forma ÚNICA e simples',
        '  - Cada parágrafo: 2-3 frases (máx 200 caracteres)',
        '  - Tom conversacional, não corporativo',
        '  - Use "você" para conectar diretamente',
        '',
        'about_image_prompt: Descrição para imagem ESPECÍFICA do produto.',
        '  - DEVE mostrar uma cena REALISTA relacionada ao produto',
        '  - Mostre PESSOAS em situação do problema OU aproveitando a solução',
        '  - Seja ESPECÍFICO ao contexto (ex: "donos de pets no parque", "freelancer trabalhando em casa")',
        '  - Evite símbolos genéricos (coração, aperto de mão, etc)',
        '  - Descreva: quem está na cena, onde estão, o que estão fazendo',
        '  - Exemplo BOM: "Two dog owners chatting in a park while their dogs play together"',
        '  - Exemplo RUIM: "Hands making heart shape" ou "People connecting"',
      ])
      .section('O QUE É O PRODUTO - Natureza e Funcionamento', [
        'Explique concretamente O QUE É e COMO FUNCIONA tecnicamente o produto.',
        'Esta seção complementa o "About" (que fala do problema) explicando a SOLUÇÃO.',
        '',
        'product_title: Título que define o tipo de produto.',
        '  - "Um app que conecta [A] com [B]"',
        '  - "Seu dashboard de [X]"',
        '  - "O marketplace de [Y]"',
        '  - "A plataforma que [faz Z]"',
        '  LIMITE: 60 caracteres. Seja específico sobre O QUE É.',
        '',
        'product_paragraphs: 2-3 parágrafos explicando:',
        '  1. A NATUREZA do produto (app mobile, web platform, marketplace, dashboard, etc)',
        '  2. COMO FUNCIONA tecnicamente (conecta usuários, processa dados, mostra insights, etc)',
        '  3. O que DIFERENCIA de outros produtos similares',
        '  - Cada parágrafo: 2-3 frases (máx 200 caracteres)',
        '  - Tom claro e direto, explique como se para alguém técnico',
        '  - Foque em arquitetura/fluxo, não em benefícios emocionais',
        '',
        'product_image_prompt: Descrição para imagem que MOSTRA o produto visualmente.',
        '  - DEVE representar visualmente O QUE É o produto',
        '  - Se é dashboard: mostre interface com gráficos, métricas, visualizações',
        '  - Se é marketplace: mostre grid de cards com produtos/serviços',
        '  - Se é app de match/conexão: mostre dois telefones com linha conectando',
        '  - Se é plataforma de dados: mostre visualização de dados, tabelas, analytics',
        '  - Se é ferramenta de edição: mostre interface com ferramentas, preview',
        '  - Seja ULTRA específico sobre a interface/visual do produto',
        '  - Exemplo BOM para app match: "Two smartphone screens side by side with curved dashed line connecting them, modern app UI visible"',
        '  - Exemplo BOM para dashboard: "Modern dashboard interface with graphs, charts, metrics cards, clean UI design"',
        '  - Exemplo BOM para marketplace: "Grid layout of service cards with photos, ratings, prices, clean marketplace interface"',
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
      .section('SHOWCASE - Prova Visual ou Resultados', [
        'Analise o tipo de produto e escolha o formato mais adequado:',
        '',
        'showcase_type: Escolha UM tipo baseado no produto:',
        '  - "visual": Se o produto GERA ou TRANSFORMA algo visual',
        '    Exemplos: editor de imagens, gerador de designs, before/after tools',
        '  - "metrics": Se o produto entrega RESULTADOS mensuráveis',
        '    Exemplos: dashboards, ferramentas de produtividade, analytics',
        '  - "use_cases": Se o produto resolve PROBLEMAS em diferentes cenários',
        '    Exemplos: plataformas genéricas, ferramentas abstratas, serviços',
        '  - "none": Se nenhum dos acima se aplicar claramente',
        '',
        'showcase_data: Estrutura depende do tipo escolhido:',
        '',
        'Se showcase_type = "visual":',
        '  "examples": [',
        '    {',
        '      "title": "Caso de uso (ex: Sala de Estar)",',
        '      "before": "Descrição do antes (ex: Ambiente vazio e sem vida)",',
        '      "after": "Descrição do depois (ex: Sala moderna mobiliada)"',
        '    }',
        '  ]',
        '  Crie 2-3 exemplos fictícios mas plausíveis.',
        '',
        'Se showcase_type = "metrics":',
        '  "results": [',
        '    {',
        '      "metric": "Valor/melhoria (ex: -40%)",',
        '      "label": "O que melhorou (ex: Tempo de inventário)",',
        '      "icon": "Emoji relevante (📊, ⚡, 💰)"',
        '    }',
        '  ]',
        '  Crie 3-4 métricas realistas para um early adopter.',
        '',
        'Se showcase_type = "use_cases":',
        '  "scenarios": [',
        '    {',
        '      "persona": "Tipo de usuário (ex: Lojista)",',
        '      "avatar": "Emoji representativo da persona (👨‍🏫, 👩‍🎨, 👨‍💻, 🧑‍🍳)",',
        '      "problem": "Dor específica (ex: Perdia muito tempo no estoque)",',
        '      "solution": "Como resolveu (ex: Agora controla tudo pelo celular em 5min)"',
        '    }',
        '  ]',
        '  Crie EXATAMENTE 3 cenários de uso com personas diferentes.',
        '  Escolha emojis que representem bem cada persona.',
        '  Cada cenário deve mostrar transformação clara (antes frustrante → depois fácil).',
        '',
        'Se showcase_type = "none":',
        '  Deixe showcase_data como objeto vazio {}',
      ])
      .section('FAQ - Eliminar Objeções', [
        'Cada pergunta deve atacar uma objeção ou medo comum.',
        '',
        'faq_items: EXATAMENTE 6 perguntas estratégicas:',
        '  1. Sobre PREÇO/CUSTO: "É grátis? Quanto vai custar?"',
        '  2. Sobre FACILIDADE: "Preciso de conhecimento técnico?"',
        '  3. Sobre TEMPO: "Quanto tempo demora para ver resultados?"',
        '  4. Sobre CONFIANÇA: "Por que devo confiar nisso?"',
        '  5. Sobre DISPONIBILIDADE: "Quando vai estar disponível?"',
        '  6. Sobre DADOS/PRIVACIDADE ou COMPATIBILIDADE: "É seguro? Funciona no meu dispositivo?"',
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
        '  "cta_text": "string (máx 50 chars)",',
        '  "hero_image_prompt": "descrição detalhada para gerar imagem hero",',
        '  "about_title": "string (máx 60 chars)",',
        '  "about_paragraphs": ["parágrafo 1", "parágrafo 2", "parágrafo 3 (opcional)"],',
        '  "about_image_prompt": "descrição detalhada para gerar imagem conceitual",',
        '  "product_title": "string (máx 60 chars)",',
        '  "product_paragraphs": ["parágrafo 1", "parágrafo 2", "parágrafo 3 (opcional)"],',
        '  "product_image_prompt": "descrição detalhada para gerar imagem do produto/interface",',
        '  "how_it_works": [',
        '    { "icon": "📸", "title": "string", "description": "string" },',
        '    { "icon": "✨", "title": "string", "description": "string" },',
        '    { "icon": "🎉", "title": "string", "description": "string" }',
        '  ],',
        '  "showcase_type": "visual" | "metrics" | "use_cases" | "none",',
        '  "showcase_data": { /* veja instruções da seção SHOWCASE */ },',
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

    console.log('[GEMINI RESPONSE] Tamanho da resposta:', response?.length || 0);
    console.log('[GEMINI RESPONSE] Preview:', response?.substring(0, 500));

    // Extrair JSON da resposta
    const variation = parseJSON(response);

    console.log('[PARSE JSON] Resultado:', variation ? 'Sucesso' : 'Falhou');
    console.log('[PARSE JSON] Tipo:', typeof variation);

    if (!variation || typeof variation !== 'object') {
      console.error('[PARSE JSON] Resposta completa que falhou:', response);
      throw new Error('Formato de resposta inválido');
    }

    // Gerar hero image com Gemini se solicitado
    let heroImageBase64 = null;
    
    if (generateHeroImage && variation.hero_image_prompt) {
      console.log('[HERO IMAGE] Iniciando geração...');
      try {
        // Criar provider de imagem
        const geminiImage = createGeminiProvider({
          apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
          model: 'gemini-2.5-flash', // modelo de texto
          // imageModel usa o padrão: 'gemini-2.5-flash-image' (barato e rápido)
        });

        // Prompt otimizado para hero de landing page
        const imagePrompt = `
          Professional hero image for a landing page in square 1:1 format.
          ${variation.hero_image_prompt}
          
          Style requirements:
          - Square 1:1 aspect ratio
          - Modern, clean, professional aesthetic
          - Bright, optimistic lighting
          - High-quality, polished look
          - Suitable for a tech/SaaS landing page
          - No text, logos, or watermarks
          - Vibrant but not oversaturated colors
        `.trim();

        heroImageBase64 = await generateImageWithRetry(geminiImage, imagePrompt);
        console.log('[HERO IMAGE] Resultado:', heroImageBase64 ? 'Sucesso' : 'Falhou (null)');
      } catch (imageError) {
        console.error('[HERO IMAGE] Erro fatal ao gerar hero image:', imageError.message);
        // Continua sem imagem se falhar
      }
    } else {
      console.log('[HERO IMAGE] Pulado (generateHeroImage ou prompt não fornecido)');
    }

    // Gerar about image se tiver prompt
    let aboutImageBase64 = null;
    if (variation.about_image_prompt && generateAboutImage) {
      console.log('[ABOUT IMAGE] Iniciando geração...');
      try {
        // Criar provider de imagem
        const geminiImage = createGeminiProvider({
          apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
          model: 'gemini-2.5-flash', // modelo de texto
          // imageModel usa o padrão: 'gemini-2.5-flash-image' (barato e rápido)
        });

        // Prompt otimizado para about section (conceitual/emocional)
        const aboutImagePrompt = `
          Conceptual image for an "about/story" section in a landing page, square 1:1 format.
          
          Product context: ${brief}
          
          Image description: ${variation.about_image_prompt}
          
          Style requirements:
          - Square 1:1 aspect ratio
          - Modern, clean, professional aesthetic
          - MUST relate directly to the product/service described above
          - Show the PROBLEM scenario or people experiencing the pain point
          - Realistic scene with people if applicable, not abstract symbols
          - Emotional and relatable to the target audience
          - Soft, natural lighting
          - No text, logos, or watermarks
          - Vibrant but authentic colors
        `.trim();

        aboutImageBase64 = await generateImageWithRetry(geminiImage, aboutImagePrompt);
        console.log('[ABOUT IMAGE] Resultado:', aboutImageBase64 ? 'Sucesso' : 'Falhou (null)');
      } catch (imageError) {
        console.error('[ABOUT IMAGE] Erro fatal ao gerar about image:', imageError.message);
        // Continua sem imagem se falhar
      }
    } else {
      console.log('[ABOUT IMAGE] Pulado (prompt não fornecido ou generateAboutImage=false)');
    }

    // Gerar product image se tiver prompt
    let productImageBase64 = null;
    if (variation.product_image_prompt && generateProductImage) {
      console.log('[PRODUCT IMAGE] Iniciando geração...');
      try {
        const geminiImage = createGeminiProvider({
          apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
          model: 'gemini-2.5-flash',
        });

        // Prompt otimizado para product section (visual do produto/interface)
        const productImagePrompt = `
          Product visualization image for a landing page, square 1:1 format.
          
          Product context: ${brief}
          
          Image description: ${variation.product_image_prompt}
          
          Style requirements:
          - Square 1:1 aspect ratio
          - Modern, clean, professional interface/product design
          - MUST show what the product IS (dashboard, app UI, marketplace, platform, etc)
          - Visual representation of the product's interface or architecture
          - High-quality, polished digital design aesthetic
          - Clean UI elements if showing interface
          - No text labels, logos, or watermarks
          - Modern color palette matching tech/SaaS products
        `.trim();

        productImageBase64 = await generateImageWithRetry(geminiImage, productImagePrompt);
        console.log('[PRODUCT IMAGE] Resultado:', productImageBase64 ? 'Sucesso' : 'Falhou (null)');
      } catch (imageError) {
        console.error('[PRODUCT IMAGE] Erro fatal ao gerar product image:', imageError.message);
        // Continua sem imagem se falhar
      }
    } else {
      console.log('[PRODUCT IMAGE] Pulado (prompt não fornecido ou generateProductImage=false)');
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
      cta_text: variation.cta_text?.slice(0, 50) || 'Quero testar',
      hero_image: heroImageBase64,
      hero_image_prompt: variation.hero_image_prompt || '',
      // About Section
      about_title: variation.about_title?.slice(0, 60) || '',
      about_paragraphs: Array.isArray(variation.about_paragraphs)
        ? variation.about_paragraphs.slice(0, 3).map(p => p?.slice(0, 200) || '')
        : [],
      about_image_prompt: variation.about_image_prompt || '',
      about_image: aboutImageBase64,
      // Product Section
      product_title: variation.product_title?.slice(0, 60) || '',
      product_paragraphs: Array.isArray(variation.product_paragraphs)
        ? variation.product_paragraphs.slice(0, 3).map(p => p?.slice(0, 200) || '')
        : [],
      product_image_prompt: variation.product_image_prompt || '',
      product_image: productImageBase64,
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
        ? variation.faq_items.slice(0, 6).map(item => ({
            question: item.question || '',
            answer: item.answer || ''
          }))
        : [],
      // Showcase
      showcase_type: variation.showcase_type || 'none',
      showcase_data: (() => {
        const type = variation.showcase_type || 'none';
        const data = variation.showcase_data || {};
        
        if (type === 'visual' && Array.isArray(data.examples)) {
          return {
            examples: data.examples.slice(0, 3).map(ex => ({
              title: ex.title || '',
              before: ex.before || '',
              after: ex.after || ''
            }))
          };
        }
        
        if (type === 'metrics' && Array.isArray(data.results)) {
          return {
            results: data.results.slice(0, 4).map(res => ({
              metric: res.metric || '',
              label: res.label || '',
              icon: res.icon || '📊'
            }))
          };
        }
        
        if (type === 'use_cases' && Array.isArray(data.scenarios)) {
          return {
            scenarios: data.scenarios.slice(0, 3).map(sc => ({
              persona: sc.persona || '',
              avatar: sc.avatar || '👤',
              problem: sc.problem || '',
              solution: sc.solution || ''
            }))
          };
        }
        
        return {};
      })(),
      // CTA Final
      cta_headline: variation.cta_headline || 'Seja um dos primeiros',
      cta_subheadline: variation.cta_subheadline || 'Cadastre-se e avisamos quando estiver pronto',
    };

    // ✅ Geração bem-sucedida, consumir slot do plano do usuário
    await consumeLandingPageSlot(userId);
    const remainingAfter = Math.max(0, limitCheck.remaining - 1);
    console.log(`[PLAN LIMITER] Slot consumido para user ${userId}. Restam ${remainingAfter} de ${limitCheck.limit}`);

    return res.status(200).json({
      variation: validVariation,
      metadata: {
        model: 'gemini-2.5-flash',
        generated_at: new Date().toISOString(),
        plan: limitCheck.plan,
        remaining: Math.max(0, limitCheck.remaining - 1),
        limit: limitCheck.limit,
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
