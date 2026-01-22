# Refatoração para AI Toolkit

Este documento descreve a refatoração realizada para integrar o **ai-toolkit** no projeto IdeaRadar.

## 📦 O que mudou?

### 1. Dependências Locais

Adicionadas referências locais aos pacotes do ai-toolkit no `package.json`:

```json
{
  "dependencies": {
    "@joaogadelha/ai-providers": "file:../ai-toolkit/packages/ai-providers",
    "@joaogadelha/prompt-builder": "file:../ai-toolkit/packages/prompt-builder",
    "@joaogadelha/rate-limiter": "file:../ai-toolkit/packages/rate-limiter",
    "@joaogadelha/react-chat": "file:../ai-toolkit/packages/react-chat"
  }
}
```

> **Nota:** Todas as dependências do ai-toolkit agora usam referências locais (`file:`) para facilitar o desenvolvimento e garantir que você está usando sempre a última versão local.

### 2. Refatoração do LLM Service (`src/services/llm.js`)

**Antes:**
- Implementação manual do Google Gemini usando `@google/generative-ai`
- Rate limiting manual com contadores em memória
- Retry logic implementado manualmente

**Depois:**
- Usa `createGeminiProvider` do `@joaogadelha/ai-providers`
- Rate limiting robusto com `@joaogadelha/rate-limiter`:
  - Limite diário configurável (GEMINI_MAX_CALLS_PER_DAY)
  - Limite por minuto do Gemini Free Tier (60 RPM)
- Retry logic mantido para robustez adicional

**Principais mudanças:**

```javascript
// ANTES
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ ... });
const result = await geminiModel.generateContent(prompt);

// DEPOIS
import { createGeminiProvider } from '@joaogadelha/ai-providers';
import { createRateLimiter, presets } from '@joaogadelha/rate-limiter';

const provider = createGeminiProvider({
  apiKey: process.env.GOOGLE_AI_API_KEY,
  model: 'gemini-2.5-flash',
  generationConfig: { temperature, maxTokens }
});

await dailyLimiter.acquire();
await minuteLimiter.acquire();
const result = await provider.generate(prompt);
```

### 3. Refatoração do Ask API (`api/ask.js`)

**Antes:**
- System prompt construído manualmente com template strings
- Difícil de manter e estender

**Depois:**
- Usa `createPrompt` do `@joaogadelha/prompt-builder`
- API fluente e estruturada
- Mais fácil de manter e modificar

**Principais mudanças:**

```javascript
// ANTES
return `Você é um assistente de análise...
CONTEXTO CRÍTICO:
...
INTERPRETAÇÃO CORRETA:
...`;

// DEPOIS
import { createPrompt } from '@joaogadelha/prompt-builder';

const systemPrompt = createPrompt()
  .role('Assistente de análise de landing pages de VALIDAÇÃO DE IDEIAS')
  .personality('Conciso, direto e focado em insights acionáveis')
  .responsibilities([...])
  .context({ total_projetos, total_leads, projetos })
  .section('CONTEXTO CRÍTICO', '...')
  .section('INTERPRETAÇÃO CORRETA DAS MÉTRICAS', [...])
  .rules([...])
  .build();
```

## 🎯 Benefícios

### 1. **Manutenibilidade**
- Código mais limpo e organizado
- Prompts estruturados são mais fáceis de modificar
- Menos código duplicado

### 2. **Robustez**
- Rate limiting profissional com múltiplas estratégias
- Suporte a múltiplos providers de IA (preparado para OpenAI, Anthropic)
- Gerenciamento de erros mais consistente

### 3. **Escalabilidade**
- Fácil adicionar novos providers (OpenAI, Anthropic)
- Fácil adicionar function calling/tools no futuro
- Rate limiting configurável por ambiente

### 4. **Reutilização**
- Toolkit compartilhado entre projetos
- Padrões consistentes de desenvolvimento
- Componentes testados e documentados

## 🔧 Configuração

As mesmas variáveis de ambiente continuam funcionando:

```env
GOOGLE_AI_API_KEY=your_key_here
GEMINI_MAX_CALLS_PER_DAY=1500
DISABLE_GEMINI=false
```

## 🚀 Próximos Passos Possíveis

Com o ai-toolkit integrado, agora é fácil:

1. **Adicionar Function Calling**
   ```javascript
   import { tool, param } from '@joaogadelha/tool-schema';
   
   const buscarMetricas = tool({
     name: 'buscar_metricas',
     description: 'Busca métricas de um projeto',
     params: {
       project_id: param.string().required()
     }
   });
   ```

2. **Adicionar Memória de Conversação**
   ```javascript
   import { createConversationMemory } from '@joaogadelha/conversation-memory';
   
   const memory = createConversationMemory({
     adapter: 'neon',
     connectionString: process.env.DATABASE_URL
   });
   ```

3. **Adicionar Response Parser**
   ```javascript
   import { parseJSON, parseList } from '@joaogadelha/response-parser';
   
   const insights = parseJSON(response);
   const sugestoes = parseList(response);
   ```

4. **Adicionar Outros Providers**
   ```javascript
   import { createOpenAIProvider } from '@joaogadelha/ai-providers';
   
   const openai = createOpenAIProvider({
     apiKey: process.env.OPENAI_API_KEY
   });
   ```

## 📝 Notas

- A API pública (`callLLM`, `callLLMWithFallback`) permanece inalterada
- Compatibilidade total com código existente
- Nenhuma breaking change para o frontend ou outras APIs
- Testes existentes devem continuar funcionando
