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
  getProjectLeads,
} from '../src/services/database.js';

/**
 * Monta o prompt de sistema com contexto dos projetos
 */
async function buildSystemPrompt(projects, metrics) {
  // Buscar todos os leads de cada projeto
  const projectLeadsMap = {};
  const projectAllLeadsMap = {};
  
  for (const project of projects) {
    const leads = await getProjectLeads(project.id);
    projectAllLeadsMap[project.id] = leads;
    const leadsWithSuggestions = leads.filter(l => l.sugestao && l.sugestao.trim());
    
    if (leadsWithSuggestions.length > 0) {
      projectLeadsMap[project.id] = leadsWithSuggestions;
    }
  }

  const projectContexts = metrics.map(m => {
    const hasMetrics = m.sessions !== null;
    const allLeads = projectAllLeadsMap[m.project_id] || [];
    const leadsWithSuggestions = projectLeadsMap[m.project_id] || [];
    
    let contextText = `
📦 **${m.project_name}**
   URL: ${m.url || 'Não definida'}
   Status: ${m.status}
   👥 Leads cadastrados: ${allLeads.length}`;

    if (!hasMetrics) {
      contextText += `
   ⚠️ Sem métricas coletadas ainda`;
    } else {
      const conversionRate = m.conversion_rate ? `${m.conversion_rate}%` : 'N/A';
      const bounceRate = m.bounce_rate ? `${m.bounce_rate}%` : 'N/A';

      contextText += `
   Última atualização: ${m.date}
   
   📊 Métricas:
   - Sessões: ${m.sessions}
   - Usuários únicos: ${m.users}
   - Taxa de rejeição: ${bounceRate}
   - Tempo médio: ${m.avg_session_duration ? `${Math.round(m.avg_session_duration)}s` : 'N/A'}
   - Cliques no CTA: ${m.cta_clicks || 0}
   - Conversões: ${m.conversions || 0}
   - Taxa de conversão: ${conversionRate}`;
    }

    // Adicionar sugestões dos leads se houver
    if (leadsWithSuggestions.length > 0) {
      contextText += `
   
   💬 Sugestões dos Usuários (${leadsWithSuggestions.length} ${leadsWithSuggestions.length === 1 ? 'sugestão' : 'sugestões'}):`;
      
      leadsWithSuggestions.forEach((lead, index) => {
        contextText += `
   ${index + 1}. "${lead.sugestao}"`;
      });
    }

    return { contextText, leadsCount: allLeads.length, suggestionsCount: leadsWithSuggestions.length };
  });

  const projectsContext = projectContexts.map(p => p.contextText).join('\n\n');
  const totalLeads = projectContexts.reduce((acc, p) => acc + p.leadsCount, 0);

  return `Você é um assistente de análise de landing pages. Responda de forma concisa e direta.

Você tem acesso aos dados de ${projects.length} projeto(s) do usuário.
Total de leads coletados (pessoas interessadas cadastradas): ${totalLeads}.

${projectsContext}

---

TERMINOLOGIA IMPORTANTE:
- **Lead** = pessoa que se cadastrou demonstrando interesse (cada registro na lista de interessados)
- **Sugestão** = feedback/comentário que um lead deixou (nem todo lead deixa sugestão)
- Se perguntarem "quantos leads", responda o total de pessoas cadastradas
- Se perguntarem "quantas sugestões", responda quantas pessoas deixaram feedback

COMPORTAMENTO OBRIGATÓRIO:

1. **Perguntas de SIM/NÃO** (ex: "tem sugestões?", "coletou dados?", "tem métricas?"):
   - Se tiver POUCOS dados (1-3 sugestões, ou métricas simples), JÁ MOSTRE junto com a resposta
   - Exemplo: "Sim, coletei 1 sugestão: 'Achei caro, qual o preço?' - Quer que eu analise?"
   - Se tiver MUITOS dados (4+), pergunte se quer ver
   - NÃO faça análise ainda

2. **Confirmações simples** (ex: "sim", "pode", "ok", "quero"):
   - O usuário está confirmando o que você ofereceu ANTES
   - Execute a ação que você ofereceu, NÃO pergunte de novo
   - Se ofereceu mostrar sugestões e ele disse "sim", MOSTRE as sugestões

3. **Pedidos para MOSTRAR dados** (ex: "traz as sugestões", "mostra as métricas", "quantos leads?"):
   - Mostre APENAS os dados pedidos, formatados de forma limpa
   - Se perguntar "quantos leads", responda com o total e pergunte se quer ver as sugestões.
   - NÃO faça análise, NÃO dê recomendações
   - Após mostrar, pergunte: "Quer que eu analise?"

4. **Pedidos de ANÁLISE** (ex: "analise", "o que você acha", "me dê insights"):
   - SOMENTE AQUI você faz análise completa
   - Identifique padrões, objeções, sentimento
   - Dê recomendações acionáveis

REGRAS:
- Seja MUITO conciso
- NUNCA pergunte duas vezes a mesma coisa
- Se tiver poucos dados, já mostre - não fique perguntando
- Responda em português do Brasil`;
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
    const systemPrompt = await buildSystemPrompt(projects, metrics);
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
