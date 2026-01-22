# Deploy na Vercel com AI Toolkit

## ✅ Configuração Atual: Git Submodule

O ai-toolkit está configurado como **submodule** do idea-radar:

```
idea-radar/
├── ai-toolkit/          ← submodule (sempre puxa última versão no deploy)
│   └── packages/
│       ├── ai-providers/
│       ├── prompt-builder/
│       ├── rate-limiter/
│       └── react-chat/
├── src/
├── api/
└── package.json
```

## 🔄 Fluxo de Trabalho

### Quando você atualiza o ai-toolkit:

1. **Faça suas alterações** no ai-toolkit
2. **Push** no repositório do ai-toolkit:
   ```bash
   cd c:\projetos\ai-toolkit
   git add .
   git commit -m "Sua mudança"
   git push
   ```
3. **Na Vercel:** O próximo deploy automaticamente puxa a última versão!

### Para atualizar localmente (desenvolvimento):

```bash
cd c:\projetos\idea-radar
git submodule update --remote
npm install
```

## 🔑 Configurar Vercel para Repo Privado

Como o ai-toolkit é **privado**, a Vercel precisa de acesso:

### Opção A: Conectar via GitHub App (Recomendado)

1. No dashboard da Vercel, vá em **Settings** → **Git**
2. Em **Connected Git Repository**, verifique se está conectado
3. A Vercel já terá acesso aos seus repos privados automaticamente

### Opção B: Personal Access Token (Se necessário)

Se o submodule não for clonado, crie um token:

1. **GitHub** → Settings → Developer settings → Personal access tokens
2. Gere um token com permissão `repo`
3. Na **Vercel**, adicione Environment Variable:
   ```
   GIT_CREDENTIALS=https://<seu-token>@github.com
   ```

## 📋 Verificar Configuração

O `vercel.json` está configurado para:

```json
{
  "buildCommand": "git submodule update --init --remote && npm install && vite build"
}
```

Isso garante que a cada deploy:
1. ✅ Clona/atualiza o ai-toolkit para a **última versão**
2. ✅ Instala dependências
3. ✅ Faz o build

## 🧪 Testar Localmente

```bash
# Simular o build da Vercel
git submodule update --init --remote
npm install
npm run build
```

## ❓ FAQ

**P: Preciso fazer commit do submodule a cada update?**
R: Não para a Vercel! O `--remote` sempre puxa a última versão. Mas para seu git local ficar sincronizado, sim.

**P: E se eu quiser fixar uma versão específica?**
R: Remova `--remote` do buildCommand. Aí usará o commit fixado no submodule.
