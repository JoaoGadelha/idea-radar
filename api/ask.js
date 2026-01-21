/**
 * API: Ask - Análise de Projetos com LLM
 * POST /api/ask
 * Body: { question: string }
 * 
 * Responde perguntas sobre os projetos do usuário usando Gemini 2.5 Flash
 */

import { authenticateRequest } from './middleware/auth.js';
import { callLLMWithFallback } from '../src/services/llm.js';
import {
  getLatestMetricsForAllProjects,
  getUserProjects,
  saveAnalysis,
} from '../src/services/database.js';

/**
 * Monta o prompt de sistema com contexto dos projetos
 */
function buildSystemPrompt(projects, metrics) {
  const projectsContext = metrics.map(m => {
    const hasMetrics = m.sessions !== null;
    
    if (!hasMetrics) {
      return `
📦 **${m.project_name}**
   URL: ${m.url || 'Não definida'}
   Status: ${m.status}
   ⚠️ Sem métricas coletadas ainda`;
    }

    const conversionRate = m.conversion_rate ? `${m.conversion_rate}%` : 'N/A';
    const bounceRate = m.bounce_rate ? `${m.bounce_rate}%` : 'N/A';

    return `
📦 **${m.project_name}**
   URL: ${m.url || 'Não definida'}
   Status: ${m.status}
   Última atualização: ${m.date}
   
   📊 Métricas:
   - Sessões: ${m.sessions}
   - Usuários únicos: ${m.users}
   - Taxa de rejeição: ${bounceRate}
   - Tempo médio: ${m.avg_session_duration ? `${Math.round(m.avg_session_duration)}s` : 'N/A'}
   - Cliques no CTA: ${m.cta_clicks || 0}
   - Conversões: ${m.conversions || 0}
   - Taxa de conversão: ${conversionRate}`;
  }).join('\n\n');

  return `Você é um analista de negócios especializado em validação de ideias e landing pages.

Você tem acesso aos dados de ${projects.length} projeto(s) do usuário:

${projectsContext}

---

Seu trabalho é:
1. Analisar os dados de forma objetiva e direta
2. Identificar quais projetos têm mais potencial (métricas melhores)
3. Explicar POR QUE alguns estão melhores que outros
4. Sugerir ações concretas para melhorar os fracos
5. Recomendar onde o usuário deve focar energia

REGRAS:
- Seja direto e objetivo, sem enrolação
- Use números para embasar suas análises
- Quando um projeto estiver claramente ruim, diga sem rodeios
- Quando um projeto tiver potencial, destaque e sugira próximos passos
- Responda sempre em português do Brasil
- Se não houver dados suficientes, diga claramente o que falta

Se o usuário perguntar algo fora do escopo (não relacionado aos projetos), responda educadamente que você só analisa métricas de projetos.`;
}

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
  const { question } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    // Buscar projetos e métricas do usuário
    const [projects, metrics] = await Promise.all([
      getUserProjects(userId),
      getLatestMetricsForAllProjects(userId),
    ]);

    if (projects.length === 0) {
      return res.status(200).json({
        answer: 'Você ainda não tem projetos cadastrados. Adicione alguns projetos primeiro para que eu possa analisá-los!',
        projectsCount: 0,
      });
    }

    // Montar prompt
    const systemPrompt = buildSystemPrompt(projects, metrics);
    const fullPrompt = `${systemPrompt}\n\n---\n\nPergunta do usuário: ${question.trim()}`;

    // Chamar LLM
    const startTime = Date.now();
    const answer = await callLLMWithFallback(fullPrompt, {
      temperature: 0.7,
      maxTokens: 2000,
    });
    const processingTime = Date.now() - startTime;

    // Salvar análise no histórico
    await saveAnalysis(userId, question.trim(), answer, metrics);

    console.log(`[Ask] Processed in ${processingTime}ms for user ${userId}`);

    return res.status(200).json({
      answer,
      projectsCount: projects.length,
      processingTimeMs: processingTime,
    });
  } catch (error) {
    console.error('[Ask] Error:', error);

    // Erro específico de rate limit
    if (error.message.includes('daily limit')) {
      return res.status(429).json({
        error: 'Limite diário atingido',
        message: 'Você atingiu o limite de análises por hoje. Tente novamente amanhã.',
      });
    }

    return res.status(500).json({
      error: 'Failed to process question',
      message: error.message,
    });
  }
}
