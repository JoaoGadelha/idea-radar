# ⚡ Sincronização Manual de Métricas

## 🎯 Como forçar a coleta de métricas para testes

O IdeaRadar coleta métricas automaticamente via cron diário (8h UTC), mas você pode forçar a sincronização manualmente.

---

## 📋 Pré-requisitos

1. Estar autenticado (ter um token JWT)
2. Ter pelo menos 1 projeto cadastrado com `status = 'active'`

---

## 🔧 Endpoint

```
POST /api/cron/sync-metrics
Authorization: Bearer <seu-token-jwt>
```

### ⚠️ Container Amarelo de Alerta

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  ATENÇÃO - MODO DE TESTE                            │
│                                                         │
│ Este endpoint gera métricas SIMULADAS para testar      │
│ o sistema. A integração real com Google Analytics 4    │
│ ainda não foi implementada.                            │
│                                                         │
│ Métricas geradas aleatoriamente:                       │
│ • Sessões: 50-550                                      │
│ • Taxa de conversão: 0.5%-15%                          │
│ • Bounce rate: 20%-70%                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Exemplos de Uso

### Via cURL (Windows PowerShell)

```powershell
# 1. Obter token (login)
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5173/api/auth/send-magic-link" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"seu@email.com"}'

# 2. Pegar o link do console e acessar para obter o token

# 3. Forçar sincronização
$token = "seu-token-jwt-aqui"

Invoke-RestMethod -Uri "http://localhost:5173/api/cron/sync-metrics" `
  -Method POST `
  -Headers @{
    "Authorization"="Bearer $token"
    "Content-Type"="application/json"
  }
```

### Via cURL (Unix/macOS)

```bash
# Forçar sincronização
curl -X POST http://localhost:5173/api/cron/sync-metrics \
  -H "Authorization: Bearer seu-token-jwt-aqui" \
  -H "Content-Type: application/json"
```

### Via JavaScript (Frontend)

```javascript
const syncMetrics = async () => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('/api/cron/sync-metrics', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log(data);
  // { success: true, synced: 3, results: [...] }
};
```

---

## 📊 Response de Sucesso

```json
{
  "success": true,
  "message": "Synced 3 project(s)",
  "synced": 3,
  "results": [
    {
      "projectId": "uuid-1",
      "projectName": "RoomGenius",
      "date": "2026-01-21",
      "sessions": 342,
      "conversions": 12,
      "conversionRate": "3.51"
    },
    {
      "projectId": "uuid-2",
      "projectName": "ProjetoX",
      "date": "2026-01-21",
      "sessions": 156,
      "conversions": 3,
      "conversionRate": "1.92"
    }
  ]
}
```

---

## 🤖 Como a LLM recebe os dados

Depois de forçar a sincronização, você pode perguntar:

```javascript
const askLLM = async () => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('/api/ask', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question: "Como estão meus projetos hoje?"
    })
  });
  
  const data = await response.json();
  console.log(data.answer);
};
```

**Resposta da LLM:**

> "Baseado nos dados de hoje (21/01/2026):
> 
> 📦 **RoomGenius** - Desempenho excelente!
> - 342 sessões com 3.51% de conversão
> - Muito acima da média de 1-2%
> - Recomendo investir mais nesse projeto
> 
> 📦 **ProjetoX** - Precisa melhorar
> - Apenas 1.92% de conversão
> - Taxa de rejeição alta (64%)
> - Sugiro revisar a proposta de valor no Hero"

---

## 🔐 Segurança

- **Produção**: Cron usa `?secret=xxx` para executar automaticamente
- **Manual**: Requer autenticação JWT válida
- **Escopo**: Usuários só veem métricas dos próprios projetos

---

## 📅 Cron Automático

O cron roda diariamente às **8h UTC** (5h BRT):

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-metrics",
      "schedule": "0 8 * * *"
    }
  ]
}
```

---

## 🎯 Próximos Passos

Quando o frontend estiver pronto, adicione um botão assim:

```jsx
<div style={{
  background: '#FEF3C7',
  border: '2px solid #F59E0B',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px'
}}>
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  }}>
    <div>
      <strong>⚡ Modo de Teste</strong>
      <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#92400E' }}>
        Força a coleta de métricas simuladas para todos os seus projetos
      </p>
    </div>
    <button 
      onClick={handleSyncMetrics}
      disabled={loading}
      style={{
        background: '#F59E0B',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600'
      }}
    >
      {loading ? 'Sincronizando...' : '🔄 Forçar Coleta'}
    </button>
  </div>
</div>
```

---

## ❓ FAQ

**P: As métricas são reais?**  
R: Não, por enquanto são simuladas. A integração com GA4 será implementada em breve.

**P: Posso rodar várias vezes no mesmo dia?**  
R: Sim, mas o banco tem `UNIQUE(project_id, date)`, então vai sobrescrever os dados do mesmo dia.

**P: Como saber se funcionou?**  
R: Verifique o response e depois pergunte à LLM sobre seus projetos.

---

Pronto! 🚀 Agora você pode testar a sincronização manual antes de implementar o frontend.
