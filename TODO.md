# IdeaRadar — Dashboard de Validação de Ideias com IA

> Objetivo: Acompanhar métricas de múltiplas landing pages e usar LLM para analisar quais ideias têm potencial.

---
## 📊 Status do Projeto

| Área | Status |
|------|--------|
| Estrutura base | ✅ Pronto |
| Serviço LLM (Gemini 2.5 Flash) | ✅ Pronto |
| Serviço Database (Neon) | ✅ Pronto |
| APIs de Auth (Magic Link) | ✅ Pronto |
| APIs de Projetos (CRUD) | ✅ Pronto |
| API de Análise LLM | ✅ Pronto |
| Webhook de Leads | ✅ Pronto |
| Landing Page Builder com IA | ✅ Pronto |
| Sistema de Créditos/Planos | ✅ Pronto |
| Integração Stripe | ✅ Pronto |
| Frontend | ✅ Pronto |
| Integração GA4 | ✅ Pronto |
| Testes Críticos | ✅ Pronto |
| Deploy | ✅ Pronto |

---
## 📋 Próximas Melhorias (Opcional)

### Bugs e Verificações
- **TODO**: Verificar se ao construir landing pages automaticamente e ao conversar com o chatbot está descontando créditos
- **TODO**: Colocar brand no builder de landing pages

### UX - Contador de Créditos
- **TODO**: Mostrar contador de gerações restantes durante loading da geração
  - Exibir abaixo da ampulheta: "Você tem direito a mais X gerações de landing page (hoje)"
  - Apenas para plano free (deixar mais explícito o limite)
  - Texto em negrito para chamar atenção
  - Prevenir uso indiscriminado/aleatório de gerações

### Decisões de Produto
- **DECIDIR**: Período da limitação (diário, semanal, mensal?)
  - Atualmente: Limitações diárias implementadas
- **DECIDIR**: Reset automático ou manual?
  - Atualmente: Manual via API /api/dev/reset-credits

### Refatoração da Termometragem
- [x] Guardrail de amostra: se sessions < 50 → avisar "amostra insuficiente, rode mais tráfego"
- [x] Conversão real no prompt: conv_real = leads/sessions (quando sessions > 0), priorizar sobre conversão GA4
- [x] Janelas 7d: média de sessions, leads e conv_real, + tendência (último dia vs média 7d)
- [x] CTA no diagnóstico: CTA alto/lead baixo → form/offer fracos; CTA baixo → headline/primeira dobra fraca
- [x] Ponderar qualidade de lead no score: + corporativo/educacional, – descartável
- [x] Diversidade de fonte: se >70% de um único UTM → alertar bolha e sugerir novos canais
- [x] Mobile share >70% + conversão baixa → sugerir revisar UX mobile

---
## 💡 Conceito

Em vez de dashboards visuais complexos, o sistema:
1. Coleta métricas do Google Analytics de cada projeto
2. Armazena em JSON/banco
3. Usa **Gemini Flash 2.0** para analisar e responder perguntas como:
   - "Quais projetos estão performando melhor?"
   - "Por que o projeto X está com conversão baixa?"
   - "Devo investir mais em qual ideia?"

---

## 🛠️ Stack

| Componente | Tecnologia |
|------------|------------|
| Frontend | React + Vite |
| Backend | Vercel Serverless |
| Banco | Neon (PostgreSQL) |
| Auth | Magic Link + Resend |
| Analytics | Google Analytics 4 (GA4) |
| LLM | Gemini 2.5 Flash (gratuito até limite) |
| Deploy | Vercel |

---

## 📊 Dados que serão coletados (via GA4 API)

Por projeto/landing page:
- **Visitas** (sessions)
- **Usuários únicos**
- **Taxa de rejeição** (bounce rate)
- **Tempo médio na página**
- **Scroll depth** (% que rolou até o CTA)
- **Cliques no CTA**
- **Conversões** (e-mails capturados)
- **Taxa de conversão** (conversões / visitas)
- **Origem do tráfego** (orgânico, pago, social)

---

## 🚀 Roadmap do MVP Funcional

### ✅ Fase 1: Backend (COMPLETO)
- [x] Criar projeto Vite + React
- [x] Configurar Vercel (vercel.json)
- [x] Criar serviço LLM (src/services/llm.js)
- [x] Criar serviço Database (src/services/database.js)
- [x] Criar APIs de Auth (magic link)
- [x] Criar APIs de Projetos (CRUD)
- [x] Criar API de Análise (/api/ask)
- [x] Criar Webhook de Leads (/api/leads)

### ✅ Fase 2: Setup do Banco (COMPLETO)
- [x] Criar database no Neon (https://neon.tech)
- [x] Rodar schema SQL (ver seção abaixo)
- [x] Configurar variáveis de ambiente no Vercel

### ✅ Fase 3: Frontend (COMPLETO)
- [x] Tela de Login (input email)
- [x] Página de verificação
- [x] AuthContext (gerenciar sessão)
- [x] Dashboard com lista de projetos
- [x] Modal/form para adicionar projeto
- [x] Chat com a LLM (área principal)

### ✅ Fase 4: Integração GA4 (COMPLETO)
- [x] Configurar Service Account no Google Cloud
- [x] API de sync de métricas (api/cron/sync-metrics.js)
- [x] Cron job diário para coletar métricas (vercel.json - 8h UTC)

### ✅ Fase 5: Deploy (COMPLETO)
- [x] Conectar repo ao Vercel
- [x] Configurar variáveis de ambiente (39 vars configuradas)
- [x] Configurar cron automático (sync diário às 8h UTC)
- [x] Adicionar testes críticos com pre-commit hooks

---

## � Estrutura Atual do Projeto

```
idea-radar/
├── api/
│   ├── auth/
│   │   ├── send-magic-link.js   ✅
│   │   ├── verify.js            ✅
│   │   └── me.js                ✅
│   ├── middleware/
│   │   └── auth.js              ✅
│   ├── projects/
│   │   ├── index.js             ✅ (GET/POST)
│   │   └── [id].js              ✅ (GET/PUT/DELETE)
│   ├── templates/
│   │   └── emailTemplates.js    ✅
│   ├── ask.js                   ✅ (POST - LLM analysis)
│   └── leads.js                 ✅ (POST - webhook)
├── src/
│   └── services/
│       ├── llm.js               ✅
│       └── database.js          ✅
├── .env.example                 ✅
├── index.html                   ✅
├── package.json                 ✅
├── vercel.json                  ✅
├── vite.config.js               ✅
└── TODO.md                      ✅
```

---

## �📐 Schema do Banco

```sql
-- Projetos/Ideias
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  ga_property_id VARCHAR(50), -- ex: "properties/123456789"
  status VARCHAR(20) DEFAULT 'active', -- active, paused, archived
  created_at TIMESTAMP DEFAULT NOW()
);

-- Métricas diárias (coletadas do GA)
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  date DATE NOT NULL,
  sessions INT DEFAULT 0,
  users INT DEFAULT 0,
  bounce_rate DECIMAL(5,2),
  avg_session_duration DECIMAL(10,2),
  cta_clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, date)
);

-- Conversões (leads capturados)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  email VARCHAR(255) NOT NULL,
  source VARCHAR(100), -- utm_source
  created_at TIMESTAMP DEFAULT NOW()
);

-- Histórico de análises da LLM (opcional)
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  question TEXT,
  answer TEXT,
  projects_context JSONB, -- snapshot dos dados analisados
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🤖 Prompt de Sistema para a LLM

```
Você é um analista de negócios especializado em validação de ideias e landing pages.

Você tem acesso aos dados de múltiplos projetos do usuário, incluindo:
- Visitas, usuários únicos
- Taxa de rejeição e tempo na página
- Cliques no CTA e conversões
- Taxa de conversão
- Histórico dos últimos 30 dias

Seu trabalho é:
1. Analisar os dados de forma objetiva
2. Identificar quais projetos têm mais potencial
3. Explicar POR QUE alguns estão melhores que outros
4. Sugerir ações concretas para melhorar os fracos
5. Recomendar onde o usuário deve focar energia

Seja direto, use números para embasar suas análises.
Quando um projeto estiver claramente ruim, diga sem rodeios.
Quando um projeto tiver potencial, destaque e sugira próximos passos.
```

---

## 🔌 APIs Necessárias

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/auth/send-magic-link` | POST | Login |
| `/api/auth/verify` | GET | Verificar token |
| `/api/projects` | GET/POST | Listar/criar projetos |
| `/api/projects/:id` | GET/PUT/DELETE | CRUD projeto |
| `/api/projects/:id/metrics` | GET | Métricas do projeto |
| `/api/sync-metrics` | POST | Força sync com GA |
| `/api/ask` | POST | Pergunta para a LLM |
| `/api/leads` | POST | Webhook para capturar leads |

---

## 🎯 Fluxo Principal

```
1. Cadastra projeto (nome + URL + GA property)
         ↓
2. Configura GA4 na landing page
         ↓
3. Métricas são coletadas automaticamente (cron diário)
         ↓
4. Usuário abre o IdeaRadar
         ↓
5. Pergunta: "Como estão meus projetos?"
         ↓
6. LLM analisa dados e responde:
   "O projeto RoomGenius teve 450 visitas com 3.2% de conversão,
    muito acima da média. Já o projeto X teve apenas 0.5% de
    conversão, sugiro revisar a copy do Hero..."
```

---

## 📱 Interface (Minimalista)

Não precisa de gráficos elaborados. Só precisa de:

1. **Lista de projetos** (nome, URL, status, última métrica resumida)
2. **Chat com a LLM** (área principal)
3. **Adicionar projeto** (modal simples)

A LLM faz o trabalho pesado de análise.

---

## 💰 Custos Estimados

| Serviço | Custo |
|---------|-------|
| Vercel | Free tier |
| Neon | Free tier (até 3GB) |
| GA4 | Gratuito |
| Gemini 2.5 Flash | Gratuito (até ~1500 req/dia) |
| Resend | Free tier (100 emails/dia) |
| **Total** | **$0/mês** (uso pessoal) |

---

## ⏱️ Estimativa de Tempo

| Fase | Tempo |
|------|-------|
| Setup base + auth | 3-4h |
| CRUD projetos | 2-3h |
| Integração GA4 API | 3-4h |
| Integração Gemini | 2-3h |
| Chat/interface | 2-3h |
| Testes e ajustes | 2-3h |
| **Total** | **~15-20h** (~2-3 dias) |

---

## 🔗 Links Úteis

- [GA4 Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Gemini API](https://ai.google.dev/gemini-api/docs)
- [Neon Serverless](https://neon.tech/docs)
- [Vercel Functions](https://vercel.com/docs/functions)

---

## 📝 Notas

- O nome "IdeaRadar" é sugestão, pode trocar
- Gemini Flash 2.0 é ideal: rápido, barato, bom para análise de dados
- A coleta do GA pode ser via API oficial ou via Google Sheets como intermediário
- Cada landing page precisará do mesmo GA4 property ID para centralizar dados

---

## 🔮 Ideias Futuras / Backlog

### Radar de Ideias (Content Intelligence)
**Status:** 💭 Conceito

**Descrição:**  
Nova aba/seção que traz periodicamente sugestões de ideias de produtos/microsaas baseadas em tendências de mercado.

**Público-alvo:**  
Desenvolvedores/indie hackers que querem lançar múltiplas landing pages rapidamente (50+ por semana) para termometrar ideias antes de implementar. Foco em quem faz vibe coding e quer automatizar o processo de validação em larga escala.

**Como funciona:**

1. **Coleta de dados** (APIs + RSS feeds):
   - Reddit API (adaptar a rate limits)
   - Product Hunt API
   - Google Trends API
   - RSS de sites tech (TechCrunch, Hacker News, etc)
   - **Nota:** Precisamos experimentar e adaptar aos bloqueios. Rate limits variam por plataforma, vamos ajustando até encontrar sweet spot de frequência vs volume de dados.

2. **Summarização em 2 etapas** (economia de tokens + custo):
   - **Etapa 1 (Resumir):** LLM fraca/barata resume cada fonte individualmente
     * Tarefa: Reddit thread (10k tokens) → resumo (200 palavras / 300 tokens)
     * Qual LLM: **GPT-3.5, Gemini Flash Lite, ou Claude Haiku** (tarefa simples, só condensar texto)
     * Custo: ~$0.0005 por thread
     * Por quê LLM fraca: Resumir é tarefa mecânica, não precisa raciocínio complexo
   
   - **Etapa 2 (Análise):** LLM forte analisa todos os resumos e identifica padrões
     * Tarefa: 30 resumos (9k tokens) → análise de padrões + scoring + identificação de ideias
     * Qual LLM: **Gemini Flash 2.0, GPT-4o-mini, ou Claude Sonnet** (requer raciocínio)
     * Custo: ~$0.002 por análise completa
     * Por quê LLM forte: Precisa avaliar múltiplas dimensões, atribuir scores, evitar falsos positivos (hype vs dor real)
   
   - **Economia total:**
     ```
     Abordagem ingênua: 30 threads × GPT-4 = ~$0.90
     Abordagem otimizada: (30 × GPT-3.5) + (1 × GPT-4) = ~$0.018
     Redução: 98% de custo + 97% menos tokens
     ```
   - **Bonus:** Etapa 1 pode rodar em paralelo (resumir 30 threads simultaneamente)

3. **Sistema de Score de Confiança** (validação cruzada):
   ```
   Score = (Reddit_mentions × 0.3) + 
           (ProductHunt_launches × 0.3) + 
           (GoogleTrends_growth × 0.4)
   
   Exemplo:
   - Reddit: 15 threads discutindo "ferramenta X" (score: 4.5)
   - Product Hunt: 3 lançamentos similares este mês (score: 3.0)
   - Google Trends: +40% de busca em 30 dias (score: 4.0)
   = Score final: 11.5/15 (Alta confiança)
   ```
   - Mostrar **Top 10 da semana** ordenado por score
   - Badge visual: 🔥 Alta (>10), ⚡ Média (5-10), 💡 Emergente (<5)

4. **Filtros Personalizados**:
   - [ ] **Tipo de projeto:**
     * 💰 Cash grab / validação rápida (MVP em 1-3 dias)
     * 🚀 Projeto médio (1-2 semanas de dev)
     * 🏢 Projeto sério / next Stripe (meses de dev)
   
   - [ ] **Barra de Dificuldade/Temperatura:**
     ```
     [❄️ Fácil] ----🌡️---- [🔥 Difícil]
        ^                    ^
     IA faz 80%      Requer arquitetura complexa
     ```
     * Fácil: Vibe coding integral, CRUD + LLM
     * Médio: Integrações, APIs externas, design custom
     * Difícil: Infra complexa, real-time, ML/AI avançado
   
   - [ ] **Foco da ideia:**
     * 🎯 Dores recorrentes (problemas sendo discutidos repetidamente)
     * 📈 Hypes/tendências (o que está bombando agora)
     * 🔍 Gaps de mercado (nichos sem solução adequada)
   
   - [ ] **Nicho/Interesse:** SaaS, Apps, E-commerce, Dev Tools, etc
   - [ ] **Frequência:** Diária, semanal, quinzenal

5. **Features Complementares:**
   
   **A. Sintetizador de Textos → Descrição de Projeto**
   - Usuário cola artigo do Medium, thread do Reddit, ou qualquer texto
   - LLM extrai: problema, solução, público-alvo, proposta de valor
   - Gera descrição estruturada do projeto (brief)
   - **Botão direto:** "Gerar Landing Page com essa ideia"
   - Fluxo completo: Texto → Brief → LP gerada → Deploy
   
   **B. Integração com Gerador de LP**
   - Quando encontrar ideia promissora com score alto
   - Botão: "Gerar LP para validar essa ideia"
   - Usa o brief gerado automaticamente
   - Loop fechado: Ideia → LP → Métricas → Análise

**Diferencial vs Concorrentes:**
- **Exploding Topics / TrendHunter:** Apenas mostram tendências
- **IdeaRadar:** Tendências + Geração de LP + Análise de métricas + IA
- **Foco:** Lançamento em volume (50 LPs/semana) com automação máxima
- **Tudo em um lugar:** Descoberta → Validação → Análise

**Tecnologias necessárias:**
- APIs oficiais (Reddit, Product Hunt, Google Trends)
- RSS feeds (TechCrunch, Hacker News)
- Cron jobs (Vercel Cron ou similar)
- PostgreSQL (storage de dados coletados + scores)
- Gemini Flash (summarização + análise, custo-benefício ótimo)
- Sistema de cache (evitar reprocessar mesmas fontes)

**Casos de uso:**
1. Dev indie quer lançar 10 ideias/semana para ver qual valida
2. Criador de conteúdo quer acompanhar nichos emergentes
3. Validar se ideia atual está em alta ou já saturada
4. Descobrir problemas recorrentes que ninguém resolveu ainda

**Schema do Banco (adicional):**
```sql
-- Fontes de conteúdo rastreadas
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50), -- reddit, producthunt, rss, trends
  identifier VARCHAR(255), -- subreddit name, RSS URL, etc
  last_scraped_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conteúdo coletado (raw)
CREATE TABLE collected_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES content_sources(id),
  title TEXT,
  content TEXT,
  url VARCHAR(500),
  summary TEXT, -- Resumo gerado pela LLM (etapa 1)
  metadata JSONB, -- upvotes, comments, author, etc
  collected_at TIMESTAMP DEFAULT NOW()
);

-- Ideias identificadas pela LLM
CREATE TABLE idea_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(100), -- SaaS, App, E-commerce, etc
  difficulty_score INT, -- 1-10 (1=fácil, 10=difícil)
  confidence_score DECIMAL(5,2), -- 0-15 (validação cruzada)
  problem TEXT,
  solution_suggestion TEXT,
  target_audience TEXT,
  sources JSONB, -- Links para threads/artigos que geraram a ideia
  reddit_mentions INT DEFAULT 0,
  producthunt_launches INT DEFAULT 0,
  google_trends_growth DECIMAL(5,2),
  project_type VARCHAR(50), -- cash_grab, medium, serious
  created_at TIMESTAMP DEFAULT NOW()
);

-- Associação usuário <> ideias salvas
CREATE TABLE user_saved_ideas (
  user_id UUID REFERENCES users(id),
  idea_id UUID REFERENCES idea_suggestions(id),
  status VARCHAR(50), -- interested, testing, validated, rejected
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, idea_id)
);
```

**MVP Simplificado (10-15h):**
1. ✅ 2 fontes fixas: Reddit API + Product Hunt API
2. ✅ Coleta semanal (cron job)
3. ✅ Summarização em 2 etapas (economia de tokens)
4. ✅ Score básico (Reddit + Product Hunt apenas)
5. ✅ Filtro por dificuldade (fácil/médio/difícil)
6. ✅ Interface: Top 5 da semana com score e badges
7. ✅ Botão "Gerar LP" integrado
8. ✅ Sintetizador de texto manual (cola texto → brief)

**Roadmap completo (20-30h):**
- [ ] Google Trends integration (validação cruzada completa)
- [ ] RSS feeds (mais fontes)
- [ ] Filtros avançados (nicho, tipo de projeto, temperatura)
- [ ] Sistema de notificações (ideias com score >12)
- [ ] Histórico de ideias (trending nos últimos 30 dias)
- [ ] Exportar brief para ferramentas externas

**Notas Importantes:**
- **Custo-benefício:** Gemini Flash é ótimo para isso (barato + rápido + bom o suficiente)
- **Foco calibrável:** Balance entre "dores recorrentes" vs "hypes" via filtros
- **Automação máxima:** Quanto menos cliques, melhor (público-alvo é preguiçoso e quer escala)
- **Adaptabilidade:** Rate limits e bloqueios variam, sistema precisa ser resiliente

**Estimativa:** MVP em 10-15h | Completo em 20-30h

---

### A/B Testing Automático
**Status:** 💭 Conceito  
**Prioridade:** 🔥 Alta (justifica plano pago)

**Descrição:**  
Gera automaticamente 3 variações de cada landing page com diferentes headlines, CTAs e esquemas de cores.

**Como funciona:**
- Input: 1 descrição de projeto
- Output: 3 LPs simultâneas (Variação A, B, C)
- Variáveis testadas:
  * Headlines (3 abordagens diferentes: problema, solução, benefício)
  * CTAs (3 verbos/urgências: "Comece agora", "Teste grátis", "Reserve seu acesso")
  * Cores (esquemas: quente, frio, neutro)
- Métricas comparativas lado a lado
- IA declara "vencedor" após 48-72h de tráfego

**Monetização:**
- ❌ **Free Plan:** Sem A/B testing
- ✅ **Pro Plan:** Até 3 variações por LP
- ✅ **Enterprise:** Variações ilimitadas + testes multivariados

**Tecnologias necessárias:**
- Mesma stack atual (geração de LP)
- Sistema de split de tráfego (subdomain ou query param: `?v=a`, `?v=b`, `?v=c`)
- Tracking separado por variação (GA4 custom dimensions ou eventos)
- Dashboard comparativo (taxa de conversão A vs B vs C)

**Estimativa:** 8-12h (geração múltipla + tracking + dashboard)

---

### Budget Allocator (IA Sugere Onde Gastar)
**Status:** 💭 Conceito  
**Prioridade:** 🚀 Muito Alta (feature killer se funcionar bem)

**Descrição:**  
IA analisa métricas de todas as LPs e sugere alocação otimizada de budget de marketing.

**Como funciona:**
1. Usuário define budget mensal (ex: $500)
2. IA analisa histórico de conversão × custo de aquisição
3. Calcula ROI projetado por projeto
4. Retorna sugestões:
   ```
   💰 Budget de $500 - Sugestão de Alocação:
   
   🎯 LP "RoomGenius": $300 (60%)
      - Conversão atual: 3.2%
      - CAC: $2.50
      - ROI projetado: 280%
   
   ⚡ LP "FitnessTracker": $150 (30%)
      - Conversão atual: 1.8%
      - CAC: $4.20
      - ROI projetado: 140%
   
   ❌ LP "CryptoNews": $0 (ignorar)
      - Conversão: 0.3%
      - CAC: $18.00
      - ROI projetado: -40%
   
   💸 Sobra: $50 → Testar nova ideia
   ```

**Inputs necessários:**
- Métricas de conversão (já temos)
- Custo de aquisição por canal (usuário informa ou integra com Meta/Google Ads)
- Valor projetado por lead (LTV estimado)

**Tecnologias necessárias:**
- Gemini Flash 2.0 (análise de dados + recomendações)
- Integração opcional: Meta Ads API, Google Ads API
- Fórmulas: ROI = ((LTV × Conversão × Visitas) - Budget) / Budget

**Estimativa:** 12-15h (incluindo integrações de ads opcionais)

---

### LP Graveyard (Post-Mortem Automático)
**Status:** 💭 Conceito  
**Prioridade:** 🔥 Alta (aprendizado acumulado)

**Descrição:**  
Quando uma LP falha ou é arquivada, IA gera análise post-mortem e armazena lições aprendidas.

**Como funciona:**
1. Usuário marca LP como "arquivada" ou sistema detecta <0.5% de conversão após 500 visitas
2. IA analisa métricas completas:
   - Taxa de rejeição vs média
   - Tempo na página vs expectativa
   - Scroll depth (chegaram no CTA?)
   - Taxa de conversão vs benchmarks
3. Gera relatório estruturado:
   ```markdown
   ## 🪦 Post-Mortem: LP "CryptoNews"
   
   ### Causa da Morte
   - Taxa de rejeição: 78% (esperado: <60%)
   - Conversão: 0.3% (esperado: >2%)
   
   ### O Que Aprendemos
   1. Headline genérica não gerou curiosidade
   2. Proposta de valor não ficou clara nos primeiros 3 segundos
   3. CTA enterrado (scroll depth médio: 40%)
   4. Nicho muito competitivo (3 concorrentes diretos)
   
   ### Não Repita
   - ❌ Headlines vagas tipo "A melhor ferramenta de..."
   - ❌ CTA abaixo da dobra em mobile
   - ❌ Validar nichos sem pesquisa de concorrentes
   
   ### Tente da Próxima
   - ✅ Headline com benefício específico
   - ✅ CTA acima da dobra + sticky button
   - ✅ Pesquisar concorrentes antes de gerar LP
   ```
4. Armazena em biblioteca de lições (fica acessível para consulta futura)

**Schema do Banco:**
```sql
CREATE TABLE lp_postmortems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  reason VARCHAR(100), -- low_conversion, high_bounce, manual_archive
  metrics_snapshot JSONB, -- métricas finais
  llm_analysis TEXT, -- análise completa da IA
  lessons_learned JSONB, -- array de lições estruturadas
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Tecnologias necessárias:**
- Gemini Flash 2.0 (análise post-mortem)
- Benchmark database (médias da indústria)
- UI: Página "Cemitério" com post-mortems organizados por data

**Estimativa:** 6-8h

---

### Competitor LP Tracker
**Status:** 💭 Conceito  
**Prioridade:** 🔥 Alta (validação de mercado)

**Descrição:**  
Monitora landing pages de concorrentes diretos (mesma ideia/nicho) para detectar saturação ou validação.

**Como funciona:**
1. Usuário cadastra LP concorrente (URL manual ou IA sugere via busca)
2. Sistema monitora semanalmente:
   - Mudanças no copy (headline, CTA)
   - Novos concorrentes no mesmo nicho
   - Presença de selo "Product Hunt #1" ou badges de validação
3. Alertas:
   ```
   ⚠️ 3 concorrentes diretos detectados para "RoomGenius"
   
   1. RoomAI.com (lançado há 2 semanas)
      - Headline similar: "Organize sua casa com IA"
      - Tem badge Product Hunt
   
   2. SmartRoomDesign.io (lançado há 1 mês)
      - Copy focado em "economia de tempo"
      
   3. AIHomeHelper.app (lançado há 5 dias)
      - Posicionamento idêntico
   
   💡 Insight: Seu nicho está validando RÁPIDO.
      → Acelere MVP ou pivote para diferencial único
   ```

**Casos de uso:**
- ✅ **3+ concorrentes surgindo:** Ideia validada, mercado existe
- ⚠️ **Saturação rápida:** Precisa de diferencial forte
- ❌ **Zero concorrentes após 2 meses:** Talvez não seja dor real

**Tecnologias necessárias:**
- Web scraping (Puppeteer ou Playwright)
- Diff checker (detectar mudanças no HTML)
- Product Hunt API (verificar se concorrente lançou)
- Google Custom Search API (buscar concorrentes similares)
- Cron job semanal

**Schema do Banco:**
```sql
CREATE TABLE competitor_trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  competitor_url VARCHAR(500),
  last_headline TEXT,
  last_cta TEXT,
  last_checked_at TIMESTAMP,
  change_log JSONB, -- histórico de mudanças detectadas
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Estimativa:** 10-12h (scraping + diff + alertas)

---

### Auto-Translator (Multi-idioma Instantâneo)
**Status:** 💭 Conceito  
**Prioridade:** 🚀 Muito Alta (expande mercado globalmente)

**Descrição:**  
1 clique → LP traduzida para 5+ idiomas (EN, ES, FR, DE, PT-BR) com adaptação cultural.

**Como funciona:**
1. Gera LP em português (ou idioma base)
2. Botão "🌍 Traduzir para 5 idiomas"
3. IA traduz não apenas palavras, mas adapta:
   - Headlines (idiomaticamente corretas)
   - CTAs (verbos culturalmente adequados)
   - Exemplos (contextualizados por país)
4. Deploy automático: `projeto.com/en`, `projeto.com/es`, etc
5. Tracking separado por idioma (qual mercado converte melhor)

**Exemplos de adaptação:**
```
PT: "Teste grátis por 7 dias"
EN: "Start your free 7-day trial"
ES: "Prueba gratis durante 7 días"
FR: "Essayez gratuitement pendant 7 jours"
DE: "7 Tage kostenlos testen"
```

**Monetização:**
- ❌ **Free Plan:** Apenas 1 idioma
- ✅ **Pro Plan:** Até 3 idiomas
- ✅ **Enterprise:** Idiomas ilimitados

**Tecnologias necessárias:**
- Google Translate API ou Gemini (tradução + adaptação cultural)
- Subdirectories ou subdomains (`/en`, `/es`, etc)
- hreflang tags (SEO multi-idioma)
- Dashboard: "Qual idioma converte melhor?"

**Estimativa:** 8-10h (tradução + deploy multi-idioma + tracking)

---

### Email Nurture Sequences (IA Gera Sequência)
**Status:** 💭 Conceito  
**Prioridade:** ⚡ Média-Alta

**Descrição:**  
Quando LP captura email, IA gera sequência de nutrição automaticamente (3-5 emails) baseada na proposta de valor.

**Como funciona:**
1. LP captura email → armazena lead
2. IA analisa copy da LP e gera sequência:
   ```
   Email 1 (imediato): Boas-vindas + reforço de benefício
   Email 2 (dia 2): Case de uso / prova social
   Email 3 (dia 5): Objeção comum resolvida
   Email 4 (dia 7): Urgência suave (beta limitado)
   Email 5 (dia 10): Última chamada ou pivot para produto
   ```
3. Integração com Resend (já usado para magic links)
4. Tracking: taxa de abertura, cliques, conversão email → produto

**Tecnologias necessárias:**
- Gemini Flash 2.0 (geração de copy dos emails)
- Resend API (envio automatizado)
- Cron jobs ou delayed jobs (agendar emails)
- Schema: tabela `email_sequences` + `email_sends`

**Estimativa:** 12-15h (geração + agendamento + tracking)

---

### SEO Auto-Boost
**Status:** 💭 Conceito  
**Prioridade:** ⚡ Média

**Descrição:**  
IA analisa LP e sugere/aplica melhorias automáticas de SEO (meta tags, structured data, alt texts).

**Como funciona:**
1. Após gerar LP, IA analisa:
   - Meta title e description ausentes ou ruins
   - Imagens sem alt text
   - Headings mal estruturados (falta H1, múltiplos H1s)
   - Schema.org markup ausente
2. Gera sugestões ou aplica automaticamente:
   ```
   ✅ Meta title: "RoomGenius - Organize Sua Casa com IA em Minutos"
   ✅ Meta description: "Transforme qualquer cômodo com sugestões de decoração personalizadas. Teste grátis."
   ✅ Alt texts: "Sala de estar organizada com sofá azul e plantas"
   ✅ Schema: {"@type": "SoftwareApplication", "name": "RoomGenius", ...}
   ```
3. Preview: "Google Search Preview" antes de publicar

**Tecnologias necessárias:**
- Gemini Flash (análise + geração de meta tags)
- Schema.org templates
- Open Graph + Twitter Card tags

**Estimativa:** 6-8h

---

### Social Proof Aggregator
**Status:** 💭 Conceito  
**Prioridade:** ⚡ Média

**Descrição:**  
Coleta automaticamente menções da LP em redes sociais (Twitter, Reddit, Product Hunt) e exibe como social proof.

**Como funciona:**
1. Usuário publica LP em Product Hunt / Twitter
2. Sistema monitora menções via APIs:
   - Twitter API: busca URL da LP
   - Reddit API: busca posts linkando LP
   - Product Hunt API: comentários e upvotes
3. Widget na LP: "🔥 12 pessoas estão discutindo isso no Twitter"
4. Ou: carrossel de comentários reais (com permissão)

**Tecnologias necessárias:**
- Twitter API v2
- Reddit API
- Product Hunt API
- Cron job (verificar menções diariamente)

**Estimativa:** 8-10h

---

### Heatmap Lite (Scroll + Click Tracking)
**Status:** 💭 Conceito  
**Prioridade:** 💡 Baixa-Média

**Descrição:**  
Tracking básico de scroll depth e cliques para entender comportamento sem ferramentas externas caras.

**Como funciona:**
- JavaScript snippet na LP rastreia:
  * Scroll depth (25%, 50%, 75%, 100%)
  * Cliques em botões, links, imagens
  * Tempo até primeiro scroll
  * Rage clicks (cliques frustrados)
- Armazena eventos no banco
- Dashboard mostra:
  ```
  📊 Heatmap Resumido:
  - 80% dos usuários não passam de 50% da página
  - CTA principal teve apenas 120 cliques (de 1500 visitas)
  → Sugestão: Mover CTA para cima
  ```

**Tecnologias necessárias:**
- JavaScript tracking snippet
- Endpoint `/api/track-event` (armazenar eventos)
- Visualização: mapa de calor simplificado

**Estimativa:** 10-12h

---

### Collaboration Mode (Equipes)
**Status:** 💭 Conceito  
**Prioridade:** 💡 Baixa (feature empresarial)

**Descrição:**  
Permite adicionar membros à conta para colaborar em projetos (comentários, edições, análises).

**Como funciona:**
- Convite por email
- Roles: Owner, Editor, Viewer
- Comentários em projetos específicos
- Histórico de mudanças (quem editou o quê)

**Monetização:**
- ❌ **Free/Pro:** Sem colaboração
- ✅ **Enterprise:** Equipes ilimitadas

**Estimativa:** 15-20h (sistema de convites + roles + UI)

---

### Webhook Automations
**Status:** 💭 Conceito  
**Prioridade:** 💡 Baixa-Média

**Descrição:**  
Permite configurar webhooks para eventos (novo lead, LP gerada, métrica atingida).

**Como funciona:**
- Usuário configura webhook URL
- Eventos disponíveis:
  * `lead.captured` → envia para CRM externo
  * `lp.generated` → notifica Slack/Discord
  * `metric.milestone` → alerta quando atingir 100 conversões
- Payload JSON com dados do evento

**Tecnologias necessárias:**
- Sistema de retry (caso webhook falhe)
- Logs de entregas

**Estimativa:** 8-10h

---

### Kill or Scale Decision Engine
**Status:** 💭 Conceito  
**Prioridade:** 🔥 Alta (feature core do produto)

**Descrição:**  
Após X dias/visitas, IA analisa métricas e declara veredicto: "Kill" (abandone) ou "Scale" (invista mais).

**Como funciona:**
1. Critérios configuráveis:
   - Mínimo: 500 visitas ou 7 dias
   - Taxa de conversão <1% = Kill
   - Taxa de conversão >2% = Scale
2. IA analisa contexto adicional:
   - Nicho tem concorrentes? (via Competitor Tracker)
   - Tendência crescente ou decrescente?
   - Custo de aquisição viável?
3. Veredicto final:
   ```
   ⚖️ VEREDICTO: LP "RoomGenius"
   
   🚀 SCALE (95% de confiança)
   
   Motivos:
   - Conversão: 3.2% (acima da média de 2%)
   - Tendência: +15% de visitas semanais
   - 2 concorrentes surgiram (valida mercado)
   - CAC viável: $2.50 vs LTV estimado $45
   
   Próximos passos:
   1. Investir $200 em Meta Ads
   2. Construir MVP em 2 semanas
   3. Configurar email nurture
   ```

**Tecnologias necessárias:**
- Gemini Flash 2.0 (análise contextual)
- Integração com todas as features anteriores (métricas, concorrentes, budget)
- UI: Badge grande no dashboard (🚀 SCALE ou 🪦 KILL)

**Estimativa:** 10-12h (lógica de decisão + prompt engineering + UI)

---

### 📝 Notas sobre Expansão de Features

**Visão Geral:**  
O IdeaRadar evoluiu de um dashboard simples de análise de LPs para uma **plataforma completa de validação de ideias em escala**.

**Público-alvo refinado:**  
Indie hackers, vibe coders e criadores que lançam **50+ LPs por semana** para termometrar o mercado antes de investir tempo em desenvolvimento.

**Diferencial competitivo:**  
Enquanto concorrentes (Exploding Topics, TrendHunter) apenas mostram tendências, o IdeaRadar oferece:
1. 🔍 Descoberta (Radar de Ideias)
2. 🚀 Geração (LP Builder com A/B testing)
3. 📊 Análise (Métricas + IA)
4. ⚖️ Decisão (Kill or Scale Engine)
5. 🌍 Escala (Multi-idioma, Budget Allocator)

**Monetização sustentável:**
- **Free:** 5 LPs/dia, 1 idioma, sem A/B testing
- **Pro ($29/mês):** 50 LPs/dia, 3 idiomas, A/B testing, email nurture
- **Enterprise ($99/mês):** Ilimitado, equipes, webhooks, API access

**Roadmap de implementação sugerido:**
1. **MVP Core** (já temos)
2. **Quick Wins** (8-12h cada):
   - LP Graveyard
   - SEO Auto-Boost
   - Auto-Translator
3. **High Impact** (10-15h cada):
   - A/B Testing Automático
   - Kill or Scale Decision Engine
   - Competitor LP Tracker
4. **Advanced** (15-20h cada):
   - Budget Allocator
   - Email Nurture Sequences
   - Radar de Ideias (content intelligence)
5. **Enterprise** (quando houver tração):
   - Collaboration Mode
   - Webhook Automations
   - Heatmap Lite

**Estimativa total:** 120-150h de desenvolvimento para plataforma completa

---

> 💡 Próximo passo: Criar estrutura do projeto e começar pelo auth + CRUD de projetos
