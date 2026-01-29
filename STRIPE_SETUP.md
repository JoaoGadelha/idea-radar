# Configuração do Stripe para IdeaRadar

## 1. Criar Produtos e Preços no Stripe Dashboard

Acesse: https://dashboard.stripe.com/products

### Produto 1: Starter Pack
- **Nome**: Starter Pack - 15 LPs + 50 Análises
- **Descrição**: Pacote inicial para validar suas ideias
- **Preços**:
  - R$ 29,00 (one-time, BRL) → Copie o `price_id` → `STRIPE_PRICE_STARTER_BRL`
  - $9.00 (one-time, USD) → Copie o `price_id` → `STRIPE_PRICE_STARTER_USD`

### Produto 2: Pro Pack (Mais Popular)
- **Nome**: Pro Pack - 50 LPs + 200 Análises
- **Descrição**: Pacote profissional para validações intensivas
- **Preços**:
  - R$ 79,00 (one-time, BRL) → Copie o `price_id` → `STRIPE_PRICE_PRO_BRL`
  - $29.00 (one-time, USD) → Copie o `price_id` → `STRIPE_PRICE_PRO_USD`

### Produto 3: Agency Pack
- **Nome**: Agency Pack - 200 LPs + 1000 Análises
- **Descrição**: Pacote para agências e power users
- **Preços**:
  - R$ 199,00 (one-time, BRL) → Copie o `price_id` → `STRIPE_PRICE_AGENCY_BRL`
  - $79.00 (one-time, USD) → Copie o `price_id` → `STRIPE_PRICE_AGENCY_USD`

---

## 2. Configurar Webhook

Acesse: https://dashboard.stripe.com/webhooks

### Criar Endpoint:
- **URL**: `https://idea-radar-react.vercel.app/api/stripe/webhook`
- **Eventos para ouvir**:
  - `checkout.session.completed` ✅ (OBRIGATÓRIO)
  - `payment_intent.payment_failed` (opcional, para logs)

### Copiar Signing Secret:
- Após criar, clique no webhook → "Reveal signing secret"
- Copie o `whsec_...` → `STRIPE_WEBHOOK_SECRET`

---

## 3. Variáveis de Ambiente na Vercel

Acesse: https://vercel.com/[seu-projeto]/settings/environment-variables

### Variáveis do Stripe:
```env
STRIPE_SECRET_KEY=sk_live_... (ou sk_test_... para testes)
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (copiar do Stripe Dashboard)
STRIPE_PRICE_STARTER_BRL=price_1ABC...
STRIPE_PRICE_STARTER_USD=price_1DEF...
STRIPE_PRICE_PRO_BRL=price_1GHI...
STRIPE_PRICE_PRO_USD=price_1JKL...
STRIPE_PRICE_AGENCY_BRL=price_1MNO...
STRIPE_PRICE_AGENCY_USD=price_1PQR...
```

---

## 4. Testar em Modo de Teste

### Usar Stripe Test Mode:
1. No Dashboard, ative "Test Mode" (toggle no canto superior direito)
2. Crie os mesmos produtos/preços em modo teste
3. Use `sk_test_...` como `STRIPE_SECRET_KEY`

### Cartões de Teste:
- ✅ Sucesso: `4242 4242 4242 4242`
- ❌ Recusado: `4000 0000 0000 0002`
- 🔐 3D Secure: `4000 0025 0000 3155`

### Testar Webhook Localmente:
```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Redirecionar webhooks para localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 5. Checklist de Segurança

- [x] Preços definidos no backend (CREDIT_PACKAGES)
- [x] Preços do Stripe são Price IDs fixos (imutáveis)
- [x] Webhook verifica assinatura (constructEvent)
- [x] Consumo de créditos é atômico (UPDATE...WHERE)
- [x] Idempotência via stripe_checkout_session_id único
- [x] Frontend só recebe sessionId, não manipula preços
- [ ] Ativar HTTPS em produção (Vercel já faz)
- [ ] Configurar domínio personalizado (opcional)

---

## 6. Fluxo de Pagamento

```
1. Usuário clica "Comprar" no frontend
   ↓
2. Frontend chama POST /api/stripe/checkout { packageId: "pro" }
   ↓
3. Backend valida packageId, busca Price ID do env
   ↓
4. Backend cria Checkout Session com metadata { userId, packageId }
   ↓
5. Frontend redireciona para session.url (Stripe Checkout)
   ↓
6. Usuário completa pagamento
   ↓
7. Stripe envia webhook checkout.session.completed
   ↓
8. Backend verifica assinatura do webhook
   ↓
9. Backend adiciona créditos ao usuário (transação atômica)
   ↓
10. Usuário é redirecionado para /dashboard?payment=success
```

---

## Arquivos Criados

- `api/stripe/checkout.js` - Cria sessão de checkout
- `api/stripe/webhook.js` - Processa pagamentos concluídos
- `api/config/plans.js` - Definição de pacotes e funções de crédito
- `migrations/add_stripe_idempotency_index.sql` - Índice para idempotência
