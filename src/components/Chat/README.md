# Chat Component

Componente de chat reutilizável com suporte a:
- ✏️ Edição de mensagens com versionamento
- 🔀 Navegação entre versões (threads independentes)
- 🔄 Retry automático em caso de falha
- 📝 Markdown básico (bold, italic, code, quotes)
- ⌨️ Shift+Enter para nova linha
- 🎨 Customização via CSS variables

## Instalação

Copie a pasta `Chat/` para seu projeto:

```
src/components/Chat/
├── Chat.jsx
├── Chat.module.css
└── index.js
```

## Uso Básico

```jsx
import { Chat } from './components/Chat';

function MyApp() {
  const handleSendMessage = async (message) => {
    // Sua lógica de API aqui
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    const data = await response.json();
    return data.answer; // Retorna string com a resposta
  };

  return (
    <Chat
      onSendMessage={handleSendMessage}
      initialMessage="Olá! Como posso ajudar?"
      suggestions={['Pergunta 1', 'Pergunta 2']}
    />
  );
}
```

## Props

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `onSendMessage` | `(message: string) => Promise<string>` | **obrigatório** | Função async que recebe a mensagem e retorna a resposta |
| `initialMessage` | `string` | `"Olá! 👋 Como posso ajudar?"` | Mensagem inicial do assistente |
| `suggestions` | `string[]` | `[]` | Sugestões de perguntas mostradas inicialmente |
| `placeholder` | `string` | `"Digite sua mensagem..."` | Placeholder do input |
| `userAvatar` | `string` | `"👤"` | Emoji/texto para avatar do usuário |
| `assistantAvatar` | `string` | `"🤖"` | Emoji/texto para avatar do assistente |
| `maxRetries` | `number` | `3` | Número máximo de tentativas em caso de erro |
| `retryDelay` | `number` | `1500` | Delay entre tentativas (ms) |
| `className` | `string` | `""` | Classe CSS adicional para o container |

## Ref Methods

O componente expõe métodos via `ref`:

```jsx
import { useRef } from 'react';
import { Chat } from './components/Chat';

function MyApp() {
  const chatRef = useRef();

  const handleReset = () => {
    chatRef.current.reset(); // Limpa conversa
  };

  const handleGetHistory = () => {
    const history = chatRef.current.getHistory();
    console.log(history); // [{ role: 'assistant', content: '...' }, ...]
  };

  return (
    <>
      <Chat ref={chatRef} onSendMessage={...} />
      <button onClick={handleReset}>Limpar</button>
    </>
  );
}
```

### Métodos disponíveis:
- `reset()` - Limpa a conversa e reinicia
- `addMessage(role, content)` - Adiciona mensagem programaticamente
- `getHistory()` - Retorna array com histórico (versão ativa de cada mensagem)
- `sendMessage(message)` - Envia mensagem programaticamente

## Customização de Cores

O componente usa CSS variables com fallbacks. Defina estas variáveis no seu CSS:

```css
:root {
  --chat-bg-secondary: #1e1e2e;
  --chat-bg-tertiary: #2a2a3e;
  --chat-border: #3a3a4e;
  --chat-text-primary: #ffffff;
  --chat-text-secondary: #a0a0b0;
  --chat-text-muted: #606070;
  --chat-accent: #6366f1;
  --chat-user-bubble: linear-gradient(135deg, #6366f1, #8b5cf6);
  --chat-send-button: linear-gradient(135deg, #6366f1, #8b5cf6);
}
```

## Tratamento de Erros

A função `onSendMessage` deve lançar erros em caso de falha:

```jsx
const handleSendMessage = async (message) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message })
  });

  if (!response.ok) {
    const error = new Error('Erro na API');
    error.status = response.status; // 401/400 não faz retry
    throw error;
  }

  const data = await response.json();
  return data.answer;
};
```

## Features

### Edição de Mensagens
- Clique em qualquer mensagem sua para editar
- Enter para enviar, Escape para cancelar
- A resposta anterior é preservada em uma versão separada

### Navegação de Versões
- Quando você edita uma mensagem, a versão anterior fica salva
- Use os chevrons (<  >) para navegar entre versões
- Cada versão mantém sua própria thread de respostas

### Markdown Suportado
- **Negrito**: `**texto**`
- *Itálico*: `*texto*`
- `Código`: `` `código` ``
- Citações longas: `"texto com mais de 20 caracteres"`
