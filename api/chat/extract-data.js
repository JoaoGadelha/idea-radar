// Extrai dados estruturados de mensagem do usuário usando Gemini
import { createGeminiProvider } from '@joaogadelha/ai-providers';

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

CAMPOS OPCIONAIS:
- pricing_plans: Planos e preços
- testimonials: Depoimentos de clientes
- guarantee: Garantia (ex: 30 dias)
- features: Funcionalidades específicas
- stats: Estatísticas (ex: "500+ usuários")

RESPONDA SEMPRE EM JSON VÁLIDO:
{
  "extractedData": {},
  "missingFields": ["title", "brief"],
  "nextQuestion": "Qual o próximo passo ou pergunta",
  "isComplete": false,
  "acknowledgment": "Sua resposta natural e amigável"
}

EXEMPLOS:
Usuário: "que campos preciso preencher?"
→ acknowledgment: "Ótima pergunta! Os campos principais são:\n\n- 📝 **Nome do projeto**\n- 💡 **Descrição** (o que faz, para quem serve)\n- 🎨 **Cor principal** (opcional)\n\nTambém posso coletar pricing, depoimentos e garantia, mas são opcionais!\n\nPode colar uma descrição completa ou ir me contando aos poucos. Como prefere começar?"

Usuário: "FitPlate, app de nutrição"
→ extractedData: {"title": "FitPlate", "brief": "App de nutrição"}
→ acknowledgment: "Legal! FitPlate - app de nutrição. Me conta mais: para quem é esse app e quais são os principais benefícios?"`;

    // Usar ai-toolkit para chamar Gemini
    const gemini = createGeminiProvider({
      apiKey: process.env.GOOGLE_AI_API_KEY,
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    });

    const aiText = await gemini.generate(prompt);
    
    console.log('[AI Response]', aiText);
    
    // Extrair JSON da resposta
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return res.status(200).json(result);
    }

    // Fallback se não conseguir parsear JSON
    return res.status(200).json({
      extractedData: {},
      missingFields: ['title', 'brief'],
      nextQuestion: '',
      isComplete: false,
      acknowledgment: 'Ótima pergunta! Os campos principais são:\n\n- 📝 **Nome do projeto**\n- 💡 **Descrição** (o que faz, para quem serve)\n- 🎯 **Benefícios principais**\n- 🎨 **Cor da marca** (opcional)\n\nTambém posso coletar pricing, depoimentos e garantia, mas são opcionais!\n\nPode colar uma descrição completa do seu projeto ou ir me contando aos poucos. Como prefere começar?'
    });

  } catch (error) {
    console.error('Erro ao processar com Gemini:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar mensagem',
      message: error.message 
    });
  }
}
