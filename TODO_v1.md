# 🎯 IdeaRadar — Checklist para V1

> Objetivo: Lançar uma versão funcional e usável do IdeaRadar
> 
> Escopo: ~~**Excluindo** sistema de pagamentos e definição de planos~~ **Incluindo** definição de planos

---

## 📋 Resumo Executivo

| Categoria | Itens | Esforço Total |
|-----------|-------|---------------|
| 🔴 Crítico | 4 | ~6h |
| 🟡 Importante | 3 | ~10h |
| 🟢 Desejável | 4 | ~8h |
| **Total** | **11** | **~24h** |

---

## 🔴 Crítico (Sem isso, não funciona de verdade)

### 0. Sistema de Créditos e Planos
**Esforço:** 4-6h  
**Status:** ❌ Pendente

**Modelo definido: Créditos (não mensalidade)**

Justificativa: Validação de ideias é uso pontual, não contínuo. Créditos não expiram, usuário volta quando tiver nova ideia.

**Planos Brasil (R$):**
```
🆓 Free         — 3 LPs + 10 análises IA
💡 Starter      — R$29 → 15 LPs + 50 análises  
🚀 Pro Pack     — R$79 → 50 LPs + 200 análises
```

**Planos EUA ($):**
```
🆓 Free         — 3 LPs + 10 análises IA
💡 Starter      — $9 → 15 LPs + 50 análises  
🚀 Pro Pack     — $29 → 50 LPs + 200 análises
```

**O que implementar:**
- [ ] Tabela `user_credits` no banco (lp_credits, analysis_credits)
- [ ] Verificação de créditos antes de gerar LP
- [ ] Verificação de créditos antes de análise IA
- [ ] Integração Stripe (checkout + webhooks)
- [ ] Detecção de país para mostrar preço correto (R$ ou $)
- [ ] Página de pricing na LP do projeto

**Decisão:** NÃO ter plano Unlimited mensal (evita exploit de "gera 200 LPs e cancela")

**Implementação técnica:**

| Requisito | Solução | Notas |
|-----------|---------|-------|
| **i18n** | Detectar `navigator.language` ou `?lang=en` | Prioridade: query param > browser > default PT |
| **Preços dinâmicos** | Detectar país via IP (ex: `ipapi.co`) | Fallback: mostrar ambos com toggle |
| **Stripe** | Usar Products + Prices com multi-currency | Stripe já suporta BRL e USD nativamente |
| **Checkout** | Stripe Checkout Session | Redirect para página Stripe, webhook confirma |
| **Webhook** | `api/stripe/webhook.js` | Atualiza créditos no banco após pagamento |

**Fluxo de compra:**
```
Usuário clica em plano → Cria Checkout Session (currency baseada no país)
→ Redirect para Stripe → Paga → Webhook recebe evento
→ Credita no banco → Redirect para dashboard com sucesso
```

---

### 1. GA4 Automático para LPs do Builder
**Esforço:** 2-3h  
**Status:** ✅ Implementado

**O que foi feito:**
- [x] Criar serviço de analytics (`src/services/analytics.js`)
- [x] Injetar GA4 automaticamente no `PublicLandingPage.jsx`
- [x] Usar `landing_page_id`, `project_id` e `slug` como dimensões customizadas
- [x] Trackear eventos automáticos:
  - `page_view` (já vem de graça)
  - `cta_click` (quando clica no botão - hero e nav)
  - `generate_lead` (quando cadastra email)
  - `scroll` (25%, 50%, 75%, 100%)
  - `time_on_page` (10s, 30s, 60s, 120s)

**Arquivos criados/modificados:**
- `src/services/analytics.js` — serviço centralizado de tracking
- `src/pages/PublicLandingPage.jsx` — inicialização do GA4
- `src/components/LandingPagePreview.jsx` — eventos de CTA e lead
- `api/l/[slug].js` — retorna project_id na API

**Configuração necessária:**
- Adicionar `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` no `.env`
- Criar propriedade GA4 no Google Analytics

---

### 2. Deploy em Produção
**Esforço:** 1-2h  
**Status:** 🔧 Parcial

**O que foi feito:**
- [x] Conectar repositório ao Vercel
- [ ] Configurar domínio customizado — *deixar para depois*
- [x] Testar fluxo completo em produção

**URL atual:** https://idea-radar-react.vercel.app

---

### 3. Variáveis de Ambiente Configuradas
**Esforço:** 30min  
**Status:** 🔧 Parcial

**Variáveis configuradas no Vercel:**
- [x] DATABASE_URL / POSTGRES_URL (Neon)
- [x] JWT_SECRET
- [x] RESEND_API_KEY — ⚠️ usando email de teste, configurar domínio próprio depois
- [x] GOOGLE_AI_API_KEY (Gemini)
- [x] GA_CREDENTIALS_JSON (Service Account)
- [x] VITE_GA_MEASUREMENT_ID=G-P13EMWM4H3
- [x] CRON_SECRET

**Pendências futuras:**
- [ ] Configurar domínio verificado no Resend (sair do email de teste)

---

## 🟡 Importante (Melhora muito a experiência)

### 3.5 Landing Page do Projeto (Home)
**Esforço:** 4-6h  
**Status:** ✅ Concluído

**Objetivo:** Criar uma LP que explica o IdeaRadar, substituindo a home atual. O CTA leva para login/signup (dashboard atual).

**Seções planejadas:**
- [x] Hero — Headline forte + subheadline + CTA
- [x] Como Funciona — 3-4 passos visuais
- [x] Features — O que o IdeaRadar oferece
- [x] Pricing — Modelo de créditos (ver abaixo)
- [x] FAQ — Perguntas comuns
- [x] CTA Final — Repetir call to action

**Modelo de Pricing proposto (créditos, não mensalidade):**
```
🆓 Free
   - 3 LPs geradas
   - 10 análises da IA
   - Métricas básicas

💡 Starter — R$29 (não expira)
   - 15 LPs geradas
   - 50 análises da IA
   - Métricas completas

🚀 Pro Pack — R$79 (não expira)
   - 50 LPs geradas
   - 200 análises da IA
   - Features avançadas

♾️ Unlimited — R$29/mês
   - Tudo ilimitado
   - Para heavy users
```

**Justificativa do modelo de créditos:**
- Validação de ideias é uso pontual, não contínuo
- Usuário não sente que "paga sem usar"
- Créditos não expiram → volta quando tiver nova ideia
- Reduz churn e fricção de recompra

**Arquivos a criar:**
- `src/pages/Home.jsx` — Nova landing page
- `src/pages/Home.module.css` — Estilos
- Atualizar `App.jsx` — Rota `/` para Home, `/app` para Dashboard

---

### 4. Mais Métricas para Enriquecer Análise
**Esforço:** 3-4h  
**Status:** ✅ Implementado

**Métricas implementadas:**

| Métrica | Por que importa | Status |
|---------|-----------------|--------|
| **Scroll depth** | Saber se leram até o CTA | ✅ Implementado (analytics.js) |
| **Tempo na página** | Engajamento real | ✅ Implementado (10s, 30s, 60s, 120s) |
| **Origem detalhada** | Qual canal converte melhor | ✅ UTM params capturados |
| **Device** | Mobile vs Desktop | ✅ GA4 + captura local |
| **Qualidade do lead** | Email pessoal vs corporativo | ✅ Classificação automática |
| **Horário de conversão** | Quando a audiência está ativa | ✅ Timestamp + timezone |
| **Retornos** | Quantos voltaram sem converter | ✅ GA4 Enhanced Measurement |

**O que foi feito:**
- [x] Implementar scroll tracking (25%, 50%, 75%, 100%)
- [x] Implementar time on page tracking (10s, 30s, 60s, 120s)
- [x] Capturar UTM params no formulário de lead
- [x] Classificar qualidade do email (corporate, personal, educational, disposable)
- [x] Capturar device info (mobile/desktop, browser, screen size)
- [x] Adicionar referrer e timezone nos metadados
- [x] Atualizar prompt da IA para mostrar breakdown de qualidade

**Arquivos criados/modificados:**
- `src/services/leadUtils.js` — Utilitários de enriquecimento de leads
- `src/components/LandingPagePreview.jsx` — Envia metadados com lead
- `api/leads.js` — Aceita e processa metadados
- `src/services/database.js` — Salva metadata e email_quality
- `api/ask.js` — Exibe qualidade e fontes no contexto da IA
- `migrations/add_leads_metadata.sql` — Adiciona colunas metadata e email_quality

---

### 5. Facilitar GA4 para LPs Externas
**Esforço:** 2-3h  
**Status:** ✅ Implementado

**O que foi feito:**
- [x] Modal com snippet pronto para copiar (básico e avançado)
- [x] Botão 📊 na lista de projetos para acessar o snippet
- [x] Tutorial in-app com dicas de uso
- [x] Snippet avançado com helper `ideaRadarTrack()` para eventos customizados
- [ ] Detector automático se página já tem GA4 (opcional - deixar para depois)
- [ ] Validador de GA Property ID (opcional - deixar para depois)

**Arquivos criados:**
- `src/components/TrackingSnippetModal.jsx` — Modal com snippet e instruções
- `src/components/TrackingSnippetModal.module.css` — Estilos do modal
- `src/components/ProjectsList.jsx` — Botão de tracking adicionado

---

### 6. Refinar Análise da IA
**Esforço:** 4-6h  
**Status:** ❌ Prompt básico

#### 6.1 Perguntas que o usuário quer responder:

1. **"Essa ideia valida ou não?"** (binário)
   - Leads > 0 com esforço mínimo = validou
   - IA deveria dar um score de 1-10 de validação

2. **"Qual das minhas ideias performou melhor?"** (ranking)
   - Comparativo lado a lado
   - Não só conversão, mas qualidade do lead

3. **"Por que essa LP não converteu?"** (diagnóstico)
   - Muito bounce? → Copy/headline ruim
   - Tempo baixo? → Não engajou
   - Scroll alto mas sem conversão? → CTA fraco

4. **"O que os leads estão pedindo?"** (qualitativo)
   - Análise de sugestões agrupadas por tema
   - Ex: "70% dos leads pediram integração com Notion"

5. **"Vale a pena continuar investindo nisso?"** (decisão)
   - ROI projetado se continuar
   - Comparar com outras ideias

6. **"Quando devo desistir?"** (kill switch)
   - 500 visitas e 0 leads? IA deveria dizer: "Pivote ou abandone"

#### 6.2 Frameworks de análise a adicionar no prompt:

```markdown
FRAMEWORKS DE ANÁLISE:

1. **Score de Validação (1-10):**
   - 1-3: Ideia não validou, considere pivotar ou abandonar
   - 4-6: Sinais mistos, precisa de mais tráfego ou ajustes
   - 7-10: Ideia validada, próximo passo é construir MVP

2. **Diagnóstico de Problemas (se conversão < 2%):**
   - Tempo na página < 30s → "Copy não engajou, headline pode estar fraca"
   - Scroll < 50% → "Visitantes não chegaram ao CTA, revisar estrutura"
   - Scroll > 80% mas sem lead → "CTA não convenceu ou formulário complexo"
   - Bounce rate não é problema em landing page single-page

3. **Análise de Sugestões (se houver):**
   - Agrupar por tema/categoria
   - Identificar feature mais pedida
   - Detectar objeções recorrentes
   - Destacar insights acionáveis

4. **Recomendação de Ação:**
   - CONTINUAR: Ideia validando, investir mais tráfego
   - AJUSTAR: Potencial existe, mas precisa de tweaks
   - PIVOTAR: Ideia não validou, mas há sinais de demanda adjacente
   - ABANDONAR: Sem sinais de interesse após tráfego suficiente
```

**Arquivos a modificar:**
- `api/ask.js` — reescrever `buildSystemPrompt()`

---

## 🟢 Desejável (Nice to have na v1)

### 7. Notificação Quando Lead Chega
**Esforço:** 1-2h  
**Status:** ❌ Não implementado

**O que fazer:**
- [ ] Enviar email via Resend quando novo lead cadastrar
- [ ] Opção de habilitar/desabilitar por projeto
- [ ] Template de email bonito com dados do lead

---

### 8. Exportar Leads (CSV)
**Esforço:** 1h  
**Status:** ❌ Não implementado

**O que fazer:**
- [ ] Botão "Exportar CSV" na lista de projetos
- [ ] Incluir: email, telefone, sugestão, data, origem

---

### 9. Histórico de Conversas com IA
**Esforço:** 2-3h  
**Status:** ❌ Não implementado

**O que fazer:**
- [ ] Salvar conversas no banco (já existe tabela `analyses`)
- [ ] Permitir ver histórico de perguntas/respostas
- [ ] Contexto entre mensagens (memória de conversa)

---

### 10. Mobile Responsivo
**Esforço:** 2-3h  
**Status:** ⚠️ Parcial

**O que fazer:**
- [ ] Revisar Dashboard em mobile
- [ ] Sidebar colapsável
- [ ] Chat adaptado para telas pequenas
- [ ] Landing pages já são responsivas ✅

---

## 🎯 Ordem de Prioridade Recomendada

Para lançar uma **v1 funcional rapidamente**:

```
Fase 1 - Fundação (~4h)
├── [30min] Configurar variáveis de ambiente
├── [2h] Deploy em produção
└── [1h] Testar fluxo completo

Fase 2 - Analytics Automático (~5h)
├── [3h] GA4 automático nas LPs do builder
└── [2h] Snippet fácil para LPs externas

Fase 3 - Análise Inteligente (~6h)
├── [4h] Refinar prompt da IA (frameworks + score)
└── [2h] Adicionar métricas básicas (scroll, UTM)

Fase 4 - Polish (~6h)
├── [2h] Notificação de leads
├── [1h] Exportar CSV
├── [2h] Histórico de conversas
└── [1h] Ajustes mobile
```

---

## 📊 Métricas de Sucesso da V1

Como saber se a v1 está funcionando:

| Métrica | Meta |
|---------|------|
| Conseguir criar LP e ela aparecer pública | ✅ Funciona |
| Leads são capturados e salvos no banco | ✅ Funciona |
| Métricas do GA4 aparecem na análise | ⏳ Precisa GA4 |
| IA responde perguntas sobre os projetos | ✅ Funciona |
| Score de validação é útil | ⏳ Precisa refinar prompt |

---

## 🔮 Ideias para V1.1+ (Backlog)

Já documentado no `TODO.md`:
- [ ] Radar de Ideias (Content Intelligence)
- [ ] A/B Testing Automático
- [ ] Budget Allocator
- [ ] LP Graveyard (Post-Mortem)
- [ ] Multi-idioma automático

---

## ⚠️ ESTRATÉGIA DE LANÇAMENTO — LEIA ISSO!

> **IMPORTANTE:** Esta seção define como gastar o budget de marketing.
> Decisão tomada: **Brasil primeiro, EUA depois.**

### Por que Brasil primeiro?

1. **Menos competição** — Ferramentas de validação de ideias são RARAS em PT-BR
2. **Budget rende mais** — R$700 no Brasil = ~200-300 cliques qualificados
3. **$400 nos EUA é POUCO** — CAC lá é 3-5x maior, não dá pra validar estatisticamente
4. **Você entende a dor** — É indie hacker brasileiro, sabe como pensam
5. **Feedback mais rápido** — Comunidades BR são menores e mais engajadas
6. **Suporte mais fácil** — Mesmo fuso, português, pode fazer calls

### Budget Recomendado (R$1000 total)

| Fase | Canal | Valor | Objetivo |
|------|-------|-------|----------|
| **1. Soft Launch BR** | Comunidades (TabNews, DevTo PT, Discord devs) | R$0 | Feedback inicial, primeiros usuários |
| **2. Validação BR** | Twitter/X Ads (BR) | R$300 | Testar mensagem, ver CTR |
| **3. Prova Social BR** | Micro-influencer indie hacker | R$400 | Gerar depoimentos, credibilidade |
| **4. Reserva US** | Guardar para depois | R$300 | Só usar após validar no Brasil |

### Cronograma

```
Semana 1-2: Soft launch em comunidades BR (custo zero)
├── Postar no TabNews, DevTo PT-BR, grupos Discord
├── Coletar feedback, ajustar produto
└── Meta: 50 signups, 10 LPs criadas

Semana 3-4: Ads no Brasil (R$300)
├── Twitter/X Ads segmentado para devs BR
├── Testar 2-3 variações de copy
└── Meta: 200 cliques, 30 signups, 5 conversões

Semana 5-6: Micro-influencer BR (R$400)
├── Indie hacker brasileiro com 5k-20k seguidores
├── Post ou thread sobre validação de ideias
└── Meta: 500 visitas, 50 signups, 10 conversões

Semana 7+: Avaliar EUA (R$300 guardados)
├── Se BR validou → traduzir LP, lançar em Product Hunt
├── Se BR falhou → iterar no Brasil antes
└── $100 = teste mínimo nos EUA (se decidir tentar)
```

### Métricas para Comparar BR vs EUA

| Métrica | O que olhar | Meta BR | Meta EUA |
|---------|-------------|---------|----------|
| **CTR do anúncio** | Qual copy/mercado engaja mais | >1.5% | >0.8% |
| **Signup rate** | Visita → Cadastro | >15% | >10% |
| **Geração de LP** | Cadastro → Cria LP | >50% | >40% |
| **Upgrade (futuro)** | Free → Pago | >5% | >3% |

### Canais BR para Soft Launch (Custo Zero)

- **TabNews** — Comunidade dev BR, aceita bem side projects
- **Dev.to em PT-BR** — Posts técnicos + case study
- **Twitter/X BR** — Indie hackers BR (seguir @levelsio etc)
- **Discord Filipe Deschamps** — Comunidade engajada
- **Reddit r/brdev** — Devs brasileiros
- **LinkedIn** — Posts sobre validação de ideias

### Copy sugerido para BR

```
"Gasto 2 meses construindo MVP só pra descobrir que ninguém quer."

E se você validasse em 2 DIAS?

IdeaRadar: Cria landing page com IA → Coleta emails → IA analisa se vale construir.

🆓 Grátis pra testar
```

### Quando expandir para EUA?

✅ **Expandir se:**
- BR validou (>5% conversão free→pago)
- Tem pelo menos 3 depoimentos reais
- LP traduzida e polida
- Budget de pelo menos $500 extra

❌ **NÃO expandir se:**
- BR não converteu
- Ainda está iterando no produto
- Não tem prova social

---

*Última atualização: Janeiro 2026*
