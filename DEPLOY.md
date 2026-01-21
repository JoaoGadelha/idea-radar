# 🚀 Checklist de Deploy - IdeaRadar

## ✅ Passo 1: Criar Database no Neon

1. Acesse https://neon.tech
2. Clique em **"Create a project"**
3. Nome do projeto: `idearadar`
4. Região: escolha mais próxima de você
5. Copie a **Connection String** (formato: `postgres://user:pass@host/db`)

### Rodar Schema SQL

No dashboard do Neon, vá em **SQL Editor** e execute:

```sql
-- Tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de projetos
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  ga_property_id VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de métricas
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
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

-- Tabela de leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  source VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, email)
);

-- Tabela de análises LLM
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question TEXT,
  answer TEXT,
  projects_context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_metrics_project_date ON metrics(project_id, date DESC);
CREATE INDEX idx_leads_project ON leads(project_id);
CREATE INDEX idx_analyses_user ON analyses(user_id);
```

---

## ✅ Passo 2: Configurar Resend (Email)

1. Acesse https://resend.com
2. Crie uma conta gratuita
3. Vá em **API Keys**
4. Clique em **"Create API Key"**
5. Nome: `IdeaRadar`
6. Copie a chave (começa com `re_`)

---

## ✅ Passo 3: Configurar Google Gemini (IA)

1. Acesse https://aistudio.google.com/app/apikey
2. Faça login com conta Google
3. Clique em **"Create API Key"**
4. Selecione um projeto do Google Cloud (ou crie um novo)
5. Copie a API Key

---

## ✅ Passo 4: Gerar Secrets

No PowerShell, execute:

```powershell
# JWT Secret (32 caracteres aleatórios)
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$jwtSecret = [Convert]::ToBase64String($bytes)
Write-Host "JWT_SECRET=$jwtSecret"

# Cron Secret (32 caracteres aleatórios)
$bytes2 = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes2)
$cronSecret = [Convert]::ToBase64String($bytes2)
Write-Host "CRON_SECRET=$cronSecret"
```

---

## ✅ Passo 5: Deploy no Vercel

### 5.1 Criar Repositório no GitHub

```powershell
# Inicializar git (se ainda não fez)
git init
git add .
git commit -m "Initial commit - IdeaRadar"

# Criar repo no GitHub e fazer push
git remote add origin https://github.com/seu-usuario/idea-radar.git
git branch -M main
git push -u origin main
```

### 5.2 Conectar ao Vercel

1. Acesse https://vercel.com
2. Clique em **"Add New Project"**
3. Selecione seu repositório `idea-radar`
4. **Framework Preset**: Vite
5. **Root Directory**: `./` (deixar padrão)

### 5.3 Configurar Variáveis de Ambiente

Na página do projeto no Vercel, vá em **Settings → Environment Variables** e adicione:

| Nome | Valor | Onde conseguir |
|------|-------|----------------|
| `POSTGRES_URL` | `postgres://user:pass@host/db` | Connection string do Neon |
| `JWT_SECRET` | `(gerado no Passo 4)` | Script PowerShell acima |
| `APP_URL` | `https://seu-projeto.vercel.app` | URL do Vercel (após primeiro deploy) |
| `RESEND_API_KEY` | `re_xxxxxxxxxxxx` | Dashboard do Resend |
| `GOOGLE_AI_API_KEY` | `AIza...` | Google AI Studio |
| `CRON_SECRET` | `(gerado no Passo 4)` | Script PowerShell acima |
| `DISABLE_RESEND` | `false` | Deixar false em produção |
| `DISABLE_GEMINI` | `false` | Deixar false em produção |
| `GEMINI_MAX_CALLS_PER_DAY` | `1500` | Limite do tier gratuito |

**IMPORTANTE**: Marque todas como **Production**, **Preview** e **Development**

### 5.4 Fazer Deploy

Clique em **"Deploy"** e aguarde o build finalizar.

---

## ✅ Passo 6: Configurar Domínio Email no Resend

Depois do primeiro deploy:

1. No Resend, vá em **Domains**
2. Adicione seu domínio (ex: `idearadar.com`)
3. Configure os registros DNS conforme instruções
4. Ou use o domínio padrão: `onboarding.resend.dev`

### Atualizar Email Template

No arquivo `api/templates/emailTemplates.js`, linha 55:

```javascript
from: 'IdeaRadar <noreply@seu-dominio.com>', // ou use onboarding.resend.dev
```

---

## ✅ Passo 7: Testar o Deploy

### 7.1 Teste de Saúde

```powershell
# Verificar se API está no ar
Invoke-RestMethod -Uri "https://seu-projeto.vercel.app/api/auth/me"
# Deve retornar: {"error":"Unauthorized","message":"Missing or invalid authorization header"}
```

### 7.2 Teste de Login

1. Acesse `https://seu-projeto.vercel.app`
2. Entre com seu email
3. Verifique se recebeu o magic link
4. Clique no link e confirme login

### 7.3 Teste de Projeto

1. Adicione um projeto (+ Novo)
2. Clique em **"🔄 Forçar Coleta"**
3. Pergunte: "Como estão meus projetos?"
4. Verifique se a IA responde

---

## ✅ Passo 8: Configurar Cron (Opcional)

O cron já está configurado no `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-metrics",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Mas precisa adicionar o `CRON_SECRET` nas variáveis de ambiente (já feito no Passo 5.3).

O cron vai rodar automaticamente todo dia às **8h UTC (5h BRT)**.

---

## ✅ Passo 9: Integração GA4 (Futuro)

Por enquanto, o sistema usa **métricas simuladas** para teste.

Para integração real com Google Analytics 4:

1. Criar Service Account no Google Cloud
2. Dar permissão de "Viewer" no GA4
3. Baixar credentials JSON
4. Adicionar variável `GA_CREDENTIALS_JSON` no Vercel
5. Implementar coleta real em `/api/cron/sync-metrics.js`

---

## 🎯 Checklist Final

- [ ] Database criado no Neon
- [ ] Schema SQL executado
- [ ] Conta Resend criada + API Key
- [ ] Google Gemini API Key obtida
- [ ] JWT_SECRET e CRON_SECRET gerados
- [ ] Repositório GitHub criado
- [ ] Projeto conectado ao Vercel
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Primeiro deploy realizado
- [ ] APP_URL atualizado com URL do Vercel
- [ ] Teste de login funcionando
- [ ] Teste de projeto funcionando
- [ ] Chat com IA respondendo

---

## 🐛 Troubleshooting

### Erro: "Failed to send magic link"
- Verifique se `RESEND_API_KEY` está correto
- Confirme que `DISABLE_RESEND=false`
- Veja logs no dashboard do Resend

### Erro: "LLM call failed"
- Verifique se `GOOGLE_AI_API_KEY` está correto
- Confirme que `DISABLE_GEMINI=false`
- Veja quota em https://aistudio.google.com

### Erro: "Database connection failed"
- Verifique se `POSTGRES_URL` está correto
- Confirme que o IP do Vercel não está bloqueado no Neon
- Teste a connection string localmente

### Email não chega
- Verifique spam/lixeira
- Use `DISABLE_RESEND=true` em dev (link aparece no console)
- Configure domínio próprio no Resend

---

## 📱 URLs Úteis

| Serviço | URL |
|---------|-----|
| Neon Dashboard | https://console.neon.tech |
| Resend Dashboard | https://resend.com/emails |
| Google AI Studio | https://aistudio.google.com |
| Vercel Dashboard | https://vercel.com/dashboard |
| Seu App | https://seu-projeto.vercel.app |

---

## 🔒 Segurança

**NUNCA** commite secrets no git:

```bash
# Adicione ao .gitignore
.env
.env.local
.env.production
```

Use apenas variáveis de ambiente do Vercel para secrets em produção.

---

Pronto! 🎉 Seu IdeaRadar estará no ar e funcional.
