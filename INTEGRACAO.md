# 🔌 Como Integrar Landing Pages ao IdeaRadar

## Visão Geral do Fluxo

```
Landing Page (RoomGenius, etc)
    ↓
    ├─→ Google Analytics 4 (métricas automáticas)
    │   └─→ IdeaRadar coleta via GA4 API (cron diário)
    │
    └─→ Webhook /api/leads (quando alguém se cadastra)
        └─→ IdeaRadar registra conversão
```

---

## 📊 Parte 1: Métricas Automáticas (Google Analytics)

### O que a landing page precisa ter:

**1. Instalar GA4 no HTML**

```html
<!-- No index.html da sua landing page -->
<head>
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  </script>
</head>
```

**2. Configurar eventos customizados** (opcional, mas recomendado)

```javascript
// Quando o usuário clica no CTA
document.querySelector('#cta-button').addEventListener('click', () => {
  gtag('event', 'cta_click', {
    event_category: 'engagement',
    event_label: 'Main CTA'
  });
});

// Quando rola até o CTA (scroll depth)
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      gtag('event', 'scroll_to_cta', {
        event_category: 'engagement'
      });
    }
  });
});
observer.observe(document.querySelector('#cta'));
```

### O que o IdeaRadar coleta automaticamente:

O cron diário (`/api/cron/sync-metrics`) busca via GA4 Data API:

- ✅ Sessões (visitas)
- ✅ Usuários únicos
- ✅ Taxa de rejeição (bounce rate)
- ✅ Tempo médio na página
- ✅ Cliques no CTA (se configurado como evento)
- ✅ Origem do tráfego (orgânico, social, direto)

**Você não precisa fazer nada além de ter o GA4 instalado.**

---

## 📧 Parte 2: Captura de Conversões (Webhook)

### Quando alguém se cadastra na landing page:

**Exemplo no componente CTA.jsx (RoomGenius):**

```jsx
import { useState } from 'react';

function CTA() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // 1. Enviar para o IdeaRadar
      const response = await fetch('https://idearadar.vercel.app/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'uuid-do-seu-projeto-no-idearadar', // Copiar do dashboard
          email: email,
          source: window.location.search // Ex: ?utm_source=google
        })
      });

      if (response.ok) {
        setStatus('success');
        
        // 2. Registrar evento no GA4
        gtag('event', 'conversion', {
          event_category: 'lead',
          event_label: 'Email Captured'
        });
        
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Erro ao capturar lead:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Quero ser notificado'}
      </button>
      
      {status === 'success' && <p>✅ Cadastro realizado!</p>}
      {status === 'error' && <p>❌ Erro ao cadastrar. Tente novamente.</p>}
    </form>
  );
}
```

### Payload do webhook:

```json
POST https://idearadar.vercel.app/api/leads
Content-Type: application/json

{
  "projectId": "uuid-do-projeto",
  "email": "joao@exemplo.com",
  "source": "?utm_source=google&utm_medium=cpc"
}
```

**Response (sucesso):**
```json
{
  "success": true,
  "message": "Lead captured successfully"
}
```

---

## 🎯 Configuração no IdeaRadar

### 1. Cadastrar o Projeto

No dashboard do IdeaRadar:

```
Nome: RoomGenius
URL: https://roomgenius.vercel.app
GA Property ID: properties/123456789 (copiar do GA4)
```

Você receberá um **Project ID** (UUID) para usar no webhook.

### 2. Vincular GA4 Property

No Google Cloud Console:
1. Criar Service Account
2. Dar permissão de "Viewer" no GA4
3. Baixar credentials JSON
4. Adicionar em `GA_CREDENTIALS_JSON` no Vercel

---

## 📈 O que a LLM recebe quando você pergunta

Quando você pergunta no IdeaRadar:  
**"Como estão meus projetos?"**

A LLM recebe algo assim:

```json
{
  "projects": [
    {
      "name": "RoomGenius",
      "url": "https://roomgenius.vercel.app",
      "status": "active",
      "metrics": {
        "date": "2026-01-21",
        "sessions": 450,
        "users": 380,
        "bounce_rate": 42.5,
        "avg_session_duration": 125,
        "cta_clicks": 89,
        "conversions": 14,
        "conversion_rate": 3.11
      }
    },
    {
      "name": "ProjetoX",
      "url": "https://projetox.com",
      "metrics": {
        "sessions": 120,
        "conversions": 1,
        "conversion_rate": 0.83
      }
    }
  ]
}
```

E responde:

> "O **RoomGenius** teve 450 visitas com **3.11% de conversão** — isso está muito acima da média de 1-2% para landing pages. Vale investir mais nele.
>
> Já o **ProjetoX** teve apenas **0.83% de conversão**. O problema parece ser a taxa de rejeição alta (68%). Sugiro revisar a copy do Hero para deixar a proposta mais clara."

---

## ⚙️ Exemplo Completo: RoomGenius

**1. Adicionar GA4** (já fizemos)

```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123"></script>
```

**2. Modificar o CTA.jsx**

```diff
- onSubmit={(e) => e.preventDefault()}
+ onSubmit={handleSubmit}

+ const handleSubmit = async (e) => {
+   e.preventDefault();
+   const email = e.target.email.value;
+   
+   await fetch('https://idearadar.vercel.app/api/leads', {
+     method: 'POST',
+     headers: { 'Content-Type': 'application/json' },
+     body: JSON.stringify({
+       projectId: 'uuid-aqui',
+       email: email
+     })
+   });
+   
+   alert('Obrigado por se cadastrar!');
+ };
```

**3. Fazer deploy**

**4. Cadastrar no IdeaRadar**

**5. Esperar 1 dia** (cron roda às 8h UTC)

**6. Perguntar à LLM:**  
*"Como está o RoomGenius?"*

---

## 🔄 Resumo do Fluxo

| Dado | Como chega |
|------|------------|
| Visitas, tempo, bounce | GA4 → Cron diário → IdeaRadar |
| Conversões (leads) | Landing page → Webhook → IdeaRadar |
| Análise | Você pergunta → LLM analisa → Resposta |

---

## 🚀 Vantagens

✅ **Zero configuração complexa** — Só GA4 + 1 fetch no form  
✅ **Centralizado** — Todas as landing pages no mesmo lugar  
✅ **Análise inteligente** — LLM compara e sugere melhorias  
✅ **Grátis** — Gemini Flash tem limite generoso  

---

## 📝 Checklist de Integração

- [ ] Instalar GA4 na landing page
- [ ] Configurar eventos customizados (CTA click, scroll)
- [ ] Cadastrar projeto no IdeaRadar
- [ ] Copiar Project ID
- [ ] Adicionar fetch ao webhook no formulário
- [ ] Testar envio de lead
- [ ] Aguardar coleta automática de métricas
- [ ] Perguntar à LLM sobre o desempenho

---

Quer que eu implemente isso no **RoomGenius** agora?
