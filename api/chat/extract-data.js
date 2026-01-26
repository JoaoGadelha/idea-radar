// Extrai dados estruturados de mensagem do usuário usando Gemini
import { createGeminiProvider } from '@joaogadelha/ai-providers';
import { parseJSON } from '@joaogadelha/response-parser';

const FALLBACK_RESPONSE = {
  extractedData: {},
  missingFields: ['title', 'brief'],
  nextQuestion: '',
  isComplete: false,
  acknowledgment: 'Ops! Tive um problema ao processar sua mensagem. 😅 Pode tentar reformular ou me contar novamente?'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userMessage, chatHistory, collectedData } = req.body;

    const prompt = `Você é um assistente especializado em coletar informações para criar landing pages.

DADOS JÁ COLETADOS:
${JSON.stringify(collectedData, null, 2)}

HISTÓRICO DA CONVERSA:
${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

NOVA MENSAGEM DO USUÁRIO:
${userMessage}

INSTRUÇÕES:
1. Se o usuário está PERGUNTANDO sobre o processo (ex: "que campos?", "o que preciso?"):
   - Explique de forma clara e amigável
   - Liste os campos principais: Nome do projeto, Descrição/O que faz, Público-alvo, Benefícios
   - Mencione que pricing, depoimentos e garantia são opcionais
   - Diga que pode colar tudo de uma vez ou ir por partes
   - USE SINTAXE MARKDOWN: Use "- " para listas não ordenadas ou "1. " para listas numeradas

2. Se o usuário está FORNECENDO INFORMAÇÕES:
   - Extraia TODOS os dados mencionados
   - Confirme o que entendeu
   - Pergunte o próximo campo importante

3. Se o usuário disse "não sei" ou "depois":
   - Aceite tranquilamente
   - Pergunte o próximo campo essencial

CAMPOS PRINCIPAIS (prioridade):
- title: Nome do produto/serviço
- brief: O que faz, para quem serve, principais funcionalidades
- primary_color: Cor da marca (opcional)

CAMPOS OPCIONAIS COMPLETOS (crie conteúdo rico se o usuário fornecer contexto):

1. **features** (array): Funcionalidades principais do produto
   Cada feature: { icon: emoji, title: string, description: string }
   Exemplo: [{ icon: "🚀", title: "Rápido", description: "Processa em segundos" }]

2. **benefits** (array): Benefícios organizados por categoria
   Cada categoria: { title: string, description: string, items: [string, string, ...] }
   Exemplo: [{ title: "Economia", description: "Reduza custos", items: ["Até 50% mais barato", "Sem taxas ocultas"] }]

3. **stats** (array): Números e estatísticas impressionantes
   Cada stat: { value: string, label: string }
   Exemplo: [{ value: "10k+", label: "Usuários ativos" }, { value: "95%", label: "Satisfação" }]

4. **testimonials** (array): Depoimentos de clientes
   Cada depoimento: { quote: string, author: string, role: string, avatar?: url }
   Exemplo: [{ quote: "Transformou nosso negócio!", author: "João Silva", role: "CEO na TechCorp" }]

5. **pricingPlans** (array): Planos de preços
   Cada plano: { name: string, price: string, period: string, features: [string, ...], highlight?: boolean }
   Exemplo: [{ name: "Pro", price: "R$ 99", period: "por mês", features: ["Acesso ilimitado", "Suporte prioritário"], highlight: true }]

6. **guarantee** (object): Garantia de satisfação
   Estrutura: { badge: emoji, title: string, description: string }
   Exemplo: { badge: "✓", title: "Garantia de 30 dias", description: "Se não gostar, devolvemos seu dinheiro" }

REGRA IMPORTANTE: Se o usuário mencionar qualquer informação relacionada a essas seções (mesmo que indiretamente), extraia e estruture os dados. Seja criativo ao preencher campos que fazem sentido baseado no contexto fornecido.

RESPONDA SEMPRE EM JSON VÁLIDO:
{
  "extractedData": {},
  "missingFields": ["title", "brief"],
  "nextQuestion": "Qual o próximo passo ou pergunta",
  "isComplete": false,
  "acknowledgment": "Sua resposta natural e amigável"
}

IMPORTANTE: Retorne APENAS o JSON puro, SEM envolver em blocos de código markdown.
O JSON deve começar com { e terminar com }.

EXEMPLOS:

1. Usuário: "que campos preciso preencher?"
→ acknowledgment: "Ótima pergunta! Os campos principais são:\n\n- 📝 **Nome do projeto**\n- 💡 **Descrição** (o que faz, para quem serve)\n- 🎨 **Cor principal** (opcional)\n\nTambém posso coletar pricing, depoimentos e garantia, mas são opcionais!\n\nPode colar uma descrição completa ou ir me contando aos poucos. Como prefere começar?"

2. Usuário: "FitPlate, app de nutrição"
→ extractedData: {"title": "FitPlate", "brief": "App de nutrição"}
→ acknowledgment: "Legal! FitPlate - app de nutrição. Me conta mais: para quem é esse app e quais são os principais benefícios?"

3. Usuário: "É um app de treino que já tem 5 mil usuários e 95% de satisfação. Tem 3 planos: básico R$29, pro R$79 e premium R$149"
→ extractedData: {
  "brief": "App de treino com alta satisfação",
  "stats": [
    {"value": "5k+", "label": "Usuários ativos"},
    {"value": "95%", "label": "Satisfação"}
  ],
  "pricingPlans": [
    {"name": "Básico", "price": "R$ 29", "period": "por mês", "features": ["Treinos básicos"], "highlight": false},
    {"name": "Pro", "price": "R$ 79", "period": "por mês", "features": ["Treinos avançados", "Suporte prioritário"], "highlight": true},
    {"name": "Premium", "price": "R$ 149", "period": "por mês", "features": ["Tudo ilimitado", "Coach pessoal"], "highlight": false}
  ]
}
→ acknowledgment: "Perfeito! Já tenho os números e preços. 💪 Tem alguma garantia (tipo 'satisfeito ou seu dinheiro de volta')? E depoimentos de clientes?"`;

    // Usar ai-toolkit para chamar Gemini
    const gemini = createGeminiProvider({
      apiKey: process.env.GOOGLE_AI_API_KEY,
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8000,
      }
    });

    const aiText = await gemini.generate(prompt);
    
    console.log('[AI Response]', aiText);
    
    // Usar response-parser para extrair JSON de forma robusta
    const result = parseJSON(aiText, { defaultValue: FALLBACK_RESPONSE });
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('Erro ao processar com Gemini:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar mensagem',
      message: error.message 
    });
  }
}
