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

> 💡 Próximo passo: Criar estrutura do projeto e começar pelo auth + CRUD de projetos
