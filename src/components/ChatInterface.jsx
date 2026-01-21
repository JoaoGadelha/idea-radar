import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './ChatInterface.module.css';

// Parser simples de markdown
function parseMarkdown(text) {
  return text
    // Bold: **texto**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic: *texto*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code: `texto`
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Quote: "texto" (aspas duplas viram blockquote)
    .replace(/"([^"]{20,})"/g, '<blockquote>"$1"</blockquote>');
}

export default function ChatInterface({ projectsCount }) {
  const { token } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Olá! 👋 Sou seu analista de projetos com IA. Tenho acesso aos dados de **${projectsCount} projeto(s)** seus.\n\nPergunte-me coisas como:\n• "Como estão meus projetos?"\n• "Qual projeto está melhor?"\n• "Por que o projeto X está ruim?"\n• "Onde devo investir meu tempo?"`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryInfo, setRetryInfo] = useState(null); // { attempt: 1, maxAttempts: 3 }
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Adiciona mensagem do usuário
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setRetryInfo(null);

    const maxAttempts = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          setRetryInfo({ attempt, maxAttempts });
        }

        const response = await fetch('/api/ask', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ question: userMessage })
        });

        const data = await response.json();

        if (response.ok) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: data.answer 
          }]);
          setRetryInfo(null);
          setLoading(false);
          return; // Sucesso!
        } else {
          lastError = data.message || data.error;
          // Se for erro de autenticação ou validação, não retenta
          if (response.status === 401 || response.status === 400) {
            break;
          }
        }
      } catch (error) {
        lastError = 'Erro de conexão';
      }

      // Se não for última tentativa, espera antes de retentar
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    // Falhou após todas tentativas
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: `⚠️ Erro: ${lastError || 'Não foi possível processar sua pergunta.'}` 
    }]);
    setRetryInfo(null);
    setLoading(false);
  };

  const suggestions = [
    'Como estão meus projetos?',
    'Qual projeto está melhor?',
    'Onde devo focar?',
    'Analise as taxas de conversão'
  ];

  return (
    <div className={styles.container}>
      <div className={styles.messages}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={styles.message}
            data-role={msg.role}
          >
              {retryInfo && (
                <div className={styles.retryInfo}>
                  🔄 Tentativa {retryInfo.attempt}/{retryInfo.maxAttempts}...
                </div>
              )}
            <div className={styles.avatar}>
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className={styles.bubble}>
              <div className={styles.content}>
                {msg.content.split('\n').map((line, i) => (
                  <p 
                    key={i} 
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(line) }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className={styles.message} data-role="assistant">
            <div className={styles.avatar}>🤖</div>
            <div className={styles.bubble}>
              <div className={styles.typing}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className={styles.suggestions}>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className={styles.suggestion}
              onClick={() => setInput(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre seus projetos..."
          className={styles.input}
          disabled={loading}
        />
        <button 
          type="submit" 
          className={styles.send}
          disabled={loading || !input.trim()}
        >
          {loading ? '...' : '📤'}
        </button>
      </form>
    </div>
  );
}
