# IdeaRadar 🎯

> Dashboard de validação de ideias com IA - Acompanhe métricas de múltiplas landing pages e use LLM para analisar quais ideias têm potencial.

![Status](https://img.shields.io/badge/status-beta-yellow)
![Version](https://img.shields.io/badge/version-0.0.1-blue)

## 📋 Sobre o Projeto

O **IdeaRadar** é uma plataforma que permite validar ideias de negócio através de landing pages e análise inteligente com IA. Em vez de dashboards visuais complexos, o sistema coleta métricas do Google Analytics e usa **Gemini Flash 2.5** para analisar e responder perguntas como:

- "Quais projetos estão performando melhor?"
- "Por que o projeto X está com conversão baixa?"
- "Devo investir mais em qual ideia?"

## ✨ Funcionalidades

### 🚀 Principais Features

- **Dashboard Minimalista**: Interface simples e focada em produtividade
- **Criador de Landing Pages**: Gerador automático de landing pages com IA
- **Chat com IA**: Analista inteligente para seus projetos usando Gemini
- **Autenticação Magic Link**: Login sem senha via e-mail
- **Gestão de Projetos**: CRUD completo de projetos e métricas
- **Captura de Leads**: Sistema de webhook para coletar e-mails e dados
- **Integração GA4**: Análise de métricas do Google Analytics 4 (em desenvolvimento)

### 📊 Métricas e Eventos GA4

O IdeaRadar usa **Google Analytics 4** para tracking completo das landing pages. Todas as métricas são coletadas automaticamente quando você usa o Landing Page Builder.

#### Métricas Coletadas (GA4 Data API)

| Métrica | Descrição |
|---------|-----------|
| `sessions` | Número de sessões na página |
| `totalUsers` | Usuários únicos |
| `bounceRate` | Taxa de rejeição (%) |
| `averageSessionDuration` | Tempo médio de sessão (seg) |
| `eventCount` | Total de eventos disparados |
| `ctaClicks` | Cliques no CTA (estimado) |
| `conversions` | E-mails capturados |
| `conversionRate` | Taxa de conversão (%) |

#### Eventos Customizados Trackados

| Evento | Descrição | Parâmetros |
|--------|-----------|------------|
| `cta_click` | Clique em qualquer botão CTA | `cta_text`, `cta_location` (hero/nav/final) |
| `generate_lead` | Lead capturado (e-mail enviado) | `method`, `has_phone`, `has_suggestion`, `value` |
| `conversion` | Marcador de conversão para GA4 | `send_to` |
| `scroll` | Profundidade de scroll atingida | `percent_scrolled` (25/50/75/100) |
| `time_on_page` | Marcos de tempo na página | `seconds` (10/30/60/120), `engagement_time_msec` |
| `section_view` | Visualização de seção específica | `section_name` |

#### Dimensões Customizadas

Cada evento inclui automaticamente:
- `landing_page_id` - ID único da landing page
- `project_id` - ID do projeto pai
- `landing_page_slug` - Slug da URL

> 💡 **Dica**: Essas dimensões permitem filtrar métricas no GA4 por landing page específica, mesmo usando um único Measurement ID.

#### Como Funciona

1. **Injeção Automática**: O script `analytics.js` é injetado automaticamente nas landing pages criadas
2. **Setup Completo**: `setupLandingPageAnalytics()` inicializa:
   - GA4 com dimensões customizadas
   - Tracking de scroll depth (25%, 50%, 75%, 100%)
   - Tracking de tempo na página (10s, 30s, 60s, 120s)
3. **Eventos Manuais**: CTA clicks e leads são trackados via `trackCTAClick()` e `trackLeadGenerated()`

## 🛠️ Stack Tecnológica

| Componente | Tecnologia |
|------------|------------|
| **Frontend** | React 19 + Vite |
| **Backend** | Vercel Serverless Functions |
| **Banco de Dados** | Neon PostgreSQL |
| **Autenticação** | Magic Link + JWT + Resend |
| **Analytics** | Google Analytics 4 (GA4) |
| **LLM** | Gemini 2.5 Flash |
| **Deploy** | Vercel |
| **UI** | React Router, React Icons, React Markdown |

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- Conta no [Vercel](https://vercel.com)
- Conta no [Neon](https://neon.tech)
- Conta no [Resend](https://resend.com)
- API Key do Google Gemini

### Passo a passo

1. **Clone o repositório**
```bash
git clone https://github.com/JoaoGadelha/idea-radar.git
cd idea-radar
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

Preencha as variáveis necessárias:
```env
# Banco de dados (Neon)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NO_SSL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=

# Autenticação
JWT_SECRET=

# E-mail (Resend)
RESEND_API_KEY=

# LLM (Gemini)
GEMINI_API_KEY=

# Google Analytics 4 (opcional)
GA4_PROPERTY_ID=
GOOGLE_APPLICATION_CREDENTIALS=
```

4. **Execute as migrações do banco**
```bash
# Conecte-se ao seu banco Neon e execute os scripts em /migrations
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## 🚀 Deploy

### Vercel

1. **Instale a CLI do Vercel**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Configure as variáveis de ambiente** no dashboard da Vercel

Consulte [DEPLOY.md](DEPLOY.md) para instruções detalhadas.

## 📁 Estrutura do Projeto

```
idea-radar/
├── api/                          # Serverless Functions (Backend)
│   ├── auth/
│   │   ├── send-magic-link.js   # Envia link mágico
│   │   ├── verify.js            # Verifica token
│   │   └── me.js                # Dados do usuário
│   ├── middleware/
│   │   └── auth.js              # Middleware de autenticação
│   ├── projects/
│   │   ├── index.js             # GET/POST projetos
│   │   └── [id].js              # GET/PUT/DELETE projeto
│   ├── landing-pages/           # CRUD landing pages
│   ├── ask.js                   # Endpoint LLM
│   └── leads.js                 # Webhook de leads
├── src/
│   ├── components/              # Componentes React
│   │   ├── ChatInterface.jsx   # Chat com IA
│   │   ├── ProjectsList.jsx    # Lista de projetos
│   │   ├── LandingPageBuilder.jsx
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.jsx     # Context de autenticação
│   ├── services/
│   │   ├── database.js         # Conexão Neon
│   │   └── llm.js              # Integração Gemini
│   ├── pages/                  # Páginas da aplicação
│   └── main.jsx                # Entry point
├── migrations/                  # SQL migrations
├── public/                      # Assets estáticos
├── .env.example                 # Template de variáveis
├── vercel.json                  # Configuração Vercel
├── vite.config.js              # Configuração Vite
└── package.json

```

## 🔑 Variáveis de Ambiente

Veja o arquivo `.env.example` para a lista completa de variáveis necessárias.

**Principais:**
- `POSTGRES_URL`: Connection string do Neon
- `JWT_SECRET`: Chave secreta para JWT (gere com `openssl rand -base64 32`)
- `RESEND_API_KEY`: API key do Resend
- `GEMINI_API_KEY`: API key do Google Gemini
- `GA4_PROPERTY_ID`: ID da propriedade GA4 (opcional)

## 💡 Como Usar

### 1. Criar uma conta
- Acesse a aplicação e insira seu e-mail
- Clique no link mágico enviado para seu e-mail

### 2. Adicionar um projeto
- Clique em "Novo Projeto"
- Preencha nome, URL e ID do GA4 (opcional)

### 3. Criar uma Landing Page
- Use o **Landing Page Builder** com IA
- Preencha um brief da sua ideia
- A IA gera automaticamente a landing page

### 4. Analisar com IA
- Use o chat para perguntar sobre seus projetos
- A IA analisa métricas e dá insights

### 5. Capturar Leads
- Adicione o código de rastreamento na sua landing page
- Os leads são salvos automaticamente

## 📚 Documentação Adicional

- [DEPLOY.md](DEPLOY.md) - Guia completo de deploy
- [TODO.md](TODO.md) - Roadmap e status do projeto
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) - Sistema de design
- [INTEGRACAO.md](INTEGRACAO.md) - Guia de integração
- [SETUP_GA4_API.md](SETUP_GA4_API.md) - Configuração do GA4

## 💰 Custos

| Serviço | Custo |
|---------|-------|
| Vercel | Free tier |
| Neon | Free tier (até 3GB) |
| GA4 | Gratuito |
| Gemini 2.5 Flash | Gratuito (até ~1500 req/dia) |
| Resend | Free tier (100 emails/dia) |
| **Total** | **$0/mês** (uso pessoal) |

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

## 📄 Licença

Este projeto é de código aberto para uso pessoal e educacional.

## 👤 Autor

**João Gadelha**

- GitHub: [@JoaoGadelha](https://github.com/JoaoGadelha)

## 🙏 Agradecimentos

- Google Gemini pela API gratuita
- Vercel pelo hosting
- Neon pelo banco de dados
- Resend pelo serviço de e-mail

---

⭐ Se este projeto foi útil para você, considere dar uma estrela!