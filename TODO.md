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
| Frontend | ✅ Pronto |
| Integração GA4 | 🔧 Pendente |
| Deploy | 🔧 Pendente |

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

### 🔧 Fase 2: Setup do Banco (VOCÊ FAZ)
- [ ] Criar database no Neon (https://neon.tech)
- [ ] Rodar schema SQL (ver seção abaixo)
- [ ] Configurar variáveis de ambiente no Vercel

### ✅ Fase 3: Frontend (COMPLETO)
- [x] Tela de Login (input email)
- [x] Página de verificação
- [x] AuthContext (gerenciar sessão)
- [x] Dashboard com lista de projetos
- [x] Modal/form para adicionar projeto
- [x] Chat com a LLM (área principal)

### 🔧 Fase 4: Integração GA4
- [ ] Configurar Service Account no Google Cloud
- [ ] API de sync de métricas
- [ ] Cron job diário para coletar métricas

### 🔧 Fase 5: Deploy
- [ ] Conectar repo ao Vercel
- [ ] Configurar variáveis de ambiente
- [ ] Testar fluxo completo

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

> 💡 Próximo passo: Criar estrutura do projeto e começar pelo auth + CRUD de projetos
