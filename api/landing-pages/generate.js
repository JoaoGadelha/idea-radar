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
    const { projectData, brief, generateHeroImage = false, regenerateImageOnly = false } = req.body;

    // Se for apenas regenerar imagem, fazer processo simplificado
    if (regenerateImageOnly && generateHeroImage) {
      try {
        
        const geminiImage = createGeminiProvider({
          apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
          model: 'gemini-2.0-flash-exp',
        });

        const imagePrompt = `
          Professional hero image for a landing page in wide 16:9 horizontal format.
          ${brief}
          
          Style requirements:
          - Wide landscape 16:9 aspect ratio (horizontal orientation)
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
        console.error('Erro ao regenerar imagem:', error.message);
        return res.status(500).json({ error: 'Erro ao regenerar imagem' });
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
        'about_image_prompt: Descrição para imagem conceitual/emocional.',
        '  - Represente o PROBLEMA ou a SOLUÇÃO visualmente',
        '  - Pode ser metafórico (ex: pessoa frustrada vs pessoa aliviada)',
        '  - Estilo: moderno, clean, cores suaves',
        '  - Evite texto na imagem',
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
        '  "cta_text": "string (máx 25 chars)",',
        '  "hero_image_prompt": "descrição detalhada para gerar imagem hero",',
        '  "about_title": "string (máx 60 chars)",',
        '  "about_paragraphs": ["parágrafo 1", "parágrafo 2", "parágrafo 3 (opcional)"],',
        '  "about_image_prompt": "descrição detalhada para gerar imagem conceitual",',
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

    // Extrair JSON da resposta
    const variation = parseJSON(response);

    if (!variation || typeof variation !== 'object') {
      throw new Error('Formato de resposta inválido');
    }

    // Gerar hero image com Gemini se solicitado
    let heroImageBase64 = null;
    
    if (generateHeroImage && variation.hero_image_prompt) {
      try {
        // Criar provider de imagem
        const geminiImage = createGeminiProvider({
          apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
          model: 'gemini-2.0-flash-exp', // modelo de texto
          // imageModel usa o padrão: 'gemini-2.5-flash-image' (barato e rápido)
        });

        // Prompt otimizado para hero de landing page
        const imagePrompt = `
          Professional hero image for a landing page in wide 16:9 horizontal format.
          ${variation.hero_image_prompt}
          
          Style requirements:
          - Wide landscape 16:9 aspect ratio (horizontal orientation)
          - Modern, clean, professional aesthetic
          - Bright, optimistic lighting
          - High-quality, polished look
          - Suitable for a tech/SaaS landing page
          - No text, logos, or watermarks
          - Vibrant but not oversaturated colors
        `.trim();

        const imageResult = await geminiImage.generateImage(imagePrompt);
        heroImageBase64 = `data:${imageResult.mimeType};base64,${imageResult.data}`;
      } catch (imageError) {
        console.error('Erro ao gerar hero image:', imageError.message);
        // Continua sem imagem se falhar
      }
    }

    // Gerar about image se tiver prompt
    let aboutImageBase64 = null;
    if (variation.about_image_prompt && heroImageType === 'ai') {
      try {
        // Criar provider de imagem
        const geminiImage = createGeminiProvider({
          apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
          model: 'gemini-2.0-flash-exp', // modelo de texto
          // imageModel usa o padrão: 'gemini-2.5-flash-image' (barato e rápido)
        });

        // Prompt otimizado para about section (conceitual/emocional)
        const aboutImagePrompt = `
          Conceptual image for an "about" section in a landing page, square 1:1 format.
          ${variation.about_image_prompt}
          
          Style requirements:
          - Square 1:1 aspect ratio
          - Modern, clean, professional aesthetic
          - Emotional and relatable
          - Soft, welcoming lighting
          - Can be abstract or metaphorical
          - Represents a problem or solution visually
          - No text, logos, or watermarks
          - Soft, pastel or neutral colors
        `.trim();

        const aboutImageResult = await geminiImage.generateImage(aboutImagePrompt);
        aboutImageBase64 = `data:${aboutImageResult.mimeType};base64,${aboutImageResult.data}`;
      } catch (imageError) {
        console.error('Erro ao gerar about image:', imageError.message);
        // Continua sem imagem se falhar
      }
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
      hero_image_prompt: variation.hero_image_prompt || '',
      // About Section
      about_title: variation.about_title?.slice(0, 60) || '',
      about_paragraphs: Array.isArray(variation.about_paragraphs)
        ? variation.about_paragraphs.slice(0, 3).map(p => p?.slice(0, 200) || '')
        : [],
      about_image_prompt: variation.about_image_prompt || '',
      about_image: aboutImageBase64,
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
