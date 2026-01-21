# Como Configurar Google Analytics 4 Data API

## 1. Google Cloud Console

### 1.1 Criar/Selecionar Projeto
1. Acesse: https://console.cloud.google.com
2. No topo, clique no seletor de projetos
3. Clique em **"New Project"** ou use um existente
4. Nome: `idea-radar-ga4` (ou outro de sua escolha)
5. Clique em **"Create"**

### 1.2 Habilitar Google Analytics Data API
1. No menu lateral, vá em **APIs & Services → Library**
2. Busque por: `Google Analytics Data API`
3. Clique no resultado **"Google Analytics Data API"**
4. Clique em **"Enable"**

### 1.3 Criar Service Account
1. No menu lateral, vá em **APIs & Services → Credentials**
2. Clique em **"Create Credentials"** → **"Service Account"**
3. Preencha:
   - **Service account name:** `idea-radar-ga4`
   - **Service account ID:** (gerado automaticamente)
   - **Description:** `Service Account para coleta de métricas do GA4`
4. Clique em **"Create and Continue"**
5. Na seção "Grant this service account access to project":
   - **Role:** Selecione `Viewer`
6. Clique em **"Continue"** → **"Done"**

### 1.4 Baixar Credenciais JSON
1. Na lista de Service Accounts, clique no email do Service Account criado
   - Formato: `idea-radar-ga4@seu-projeto-id.iam.gserviceaccount.com`
2. Vá na aba **"Keys"**
3. Clique em **"Add Key"** → **"Create new key"**
4. Selecione tipo: **JSON**
5. Clique em **"Create"**
6. O arquivo JSON será baixado automaticamente
   - ⚠️ **GUARDE ESTE ARQUIVO COM SEGURANÇA!**
   - Ele contém as credenciais de acesso

## 2. Google Analytics Admin

### 2.1 Dar Permissão ao Service Account
1. Acesse: https://analytics.google.com
2. Clique no ícone de engrenagem (Admin) no canto inferior esquerdo
3. Na coluna **Property**, clique em **"Property Access Management"**
4. Clique no botão **"+"** (Add users)
5. Cole o email do Service Account:
   - `idea-radar-ga4@seu-projeto-id.iam.gserviceaccount.com`
6. Marque a role: **Viewer**
7. Desmarque **"Notify new users by email"** (Service Accounts não recebem email)
8. Clique em **"Add"**

## 3. Vercel - Adicionar Variável de Ambiente

### 3.1 Preparar o JSON
1. Abra o arquivo JSON baixado no passo 1.4
2. **Copie TODO o conteúdo** (é um objeto JSON grande)
3. **IMPORTANTE:** O JSON deve ficar em **uma única linha**
   - Se estiver formatado (com quebras de linha), pode copiar direto
   - O Vercel aceita ambos os formatos

### 3.2 Adicionar no Vercel
1. Acesse: https://vercel.com/joaogadelha/idea-radar-react/settings/environment-variables
2. Clique em **"Add New"**
3. Preencha:
   - **Name:** `GA_CREDENTIALS_JSON`
   - **Value:** Cole todo o conteúdo do arquivo JSON
   - **Environments:** Marque `Production`, `Preview`, e `Development`
4. Clique em **"Save"**

### 3.3 Redesployar
1. Vá em: https://vercel.com/joaogadelha/idea-radar-react
2. Na aba **"Deployments"**, clique nos 3 pontinhos do último deployment
3. Clique em **"Redeploy"**
4. Aguarde o deploy terminar (~1-2 minutos)

## 4. Testar

1. Acesse: https://idea-radar-react.vercel.app
2. Faça login
3. Clique no botão **🔄 Forçar Coleta**
4. Deve aparecer: ✅ 1 projeto(s) sincronizado(s)!
5. Confira se as métricas reais aparecem na tabela

---

## Exemplo do JSON de Credenciais

```json
{
  "type": "service_account",
  "project_id": "seu-projeto-12345",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "idea-radar-ga4@seu-projeto-12345.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## Troubleshooting

### Erro: "GA_CREDENTIALS_JSON não configurado"
- Verifique se adicionou a variável no Vercel
- Confirme se redesployou após adicionar a variável

### Erro: "Permission denied"
- Verifique se deu permissão **Viewer** ao Service Account no GA4
- Confirme se usou o email correto do Service Account

### Erro: "No data available"
- Verifique se o projeto tem tráfego recente (últimas 24h)
- Confirme se o GA Property ID está correto no banco de dados

### Dados não aparecem na tabela
- Abra o console do navegador (F12) e verifique erros
- Confira os logs no Vercel Dashboard
