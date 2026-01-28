# 🎯 IdeaRadar — Checklist para V1

> Objetivo: Lançar uma versão funcional e usável do IdeaRadar
> 
> Escopo: **Excluindo** sistema de pagamentos e definição de planos

---

## 📋 Resumo Executivo

| Categoria | Itens | Esforço Total |
|-----------|-------|---------------|
| 🔴 Crítico | 3 | ~4h |
| 🟡 Importante | 3 | ~10h |
| 🟢 Desejável | 4 | ~8h |
| **Total** | **10** | **~22h** |

---

## 🔴 Crítico (Sem isso, não funciona de verdade)

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
**Status:** ✅ Concluído

**O que foi feito:**
- [x] Conectar repositório ao Vercel
- [ ] Configurar domínio (se tiver) — opcional, usando URL do Vercel
- [x] Testar fluxo completo em produção

**URL:** https://idea-radar-react.vercel.app

---

### 3. Variáveis de Ambiente Configuradas
**Esforço:** 30min  
**Status:** ✅ Concluído

**Variáveis configuradas no Vercel:**
- [x] DATABASE_URL / POSTGRES_URL (Neon)
- [x] JWT_SECRET
- [x] RESEND_API_KEY
- [x] GOOGLE_AI_API_KEY (Gemini)
- [x] GA_CREDENTIALS_JSON (Service Account)
- [x] VITE_GA_MEASUREMENT_ID=G-P13EMWM4H3
- [x] CRON_SECRET

---

## 🟡 Importante (Melhora muito a experiência)

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
**Status:** ❌ Não implementado

**O que fazer:**
- [ ] Criar página/modal com snippet pronto para copiar
- [ ] Tutorial in-app explicando como configurar
- [ ] Detector automático se página já tem GA4 (via scraping opcional)
- [ ] Validador de GA Property ID

**Snippet exemplo a gerar:**
```html
<!-- IdeaRadar Tracking - Projeto: {nome} -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {
    'project_id': '{project_id}',
    'user_id': '{user_id}'
  });
</script>
```

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

*Última atualização: Janeiro 2026*
