import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import styles from './Chat.module.css';

// Ícones SVG inline para não depender de react-icons
const ChevronLeft = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
  </svg>
);

// Parser simples de markdown
function parseMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/"([^"]{20,})"/g, '<div style="margin: 8px 0; padding: 12px 16px; background: rgba(99, 102, 241, 0.1); border-left: 4px solid #6366f1; border-radius: 0 8px 8px 0; font-style: italic; color: #a5b4fc;">"$1"</div>');
}

/**
 * Chat Component - Componente de chat reutilizável com suporte a:
 * - Edição de mensagens com versionamento
 * - Navegação entre versões (threads independentes)
 * - Retry automático
 * - Markdown básico
 * 
 * @param {Object} props
 * @param {Function} props.onSendMessage - Função async que recebe a mensagem e retorna a resposta
 *                                         Signature: (message: string) => Promise<string>
 * @param {string} [props.initialMessage] - Mensagem inicial do assistente
 * @param {string[]} [props.suggestions] - Sugestões de perguntas para mostrar inicialmente
 * @param {string} [props.placeholder] - Placeholder do input
 * @param {string} [props.userAvatar] - Emoji/texto para avatar do usuário (default: '👤')
 * @param {string} [props.assistantAvatar] - Emoji/texto para avatar do assistente (default: '🤖')
 * @param {number} [props.maxRetries] - Número máximo de tentativas (default: 3)
 * @param {number} [props.retryDelay] - Delay entre tentativas em ms (default: 1500)
 * @param {string} [props.className] - Classe CSS adicional para o container
 */
const Chat = forwardRef(function Chat({
  onSendMessage,
  initialMessage = 'Olá! 👋 Como posso ajudar?',
  suggestions = [],
  placeholder = 'Digite sua mensagem... (Shift+Enter para nova linha)',
  userAvatar = '👤',
  assistantAvatar = '🤖',
  maxRetries = 3,
  retryDelay = 1500,
  className = ''
}, ref) {
  // Estrutura: cada mensagem pode ter múltiplas versões, cada uma com sua própria thread
  // versions: [{ content: "texto", followUps: [mensagens que vieram depois] }]
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      versions: [{ content: initialMessage }],
      activeVersion: 0
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryInfo, setRetryInfo] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const editInputRef = useRef(null);
  const containerRef = useRef(null);

  // Expor métodos via ref
  useImperativeHandle(ref, () => ({
    // Limpar conversa e reiniciar
    reset: () => {
      setMessages([{
        role: 'assistant',
        versions: [{ content: initialMessage }],
        activeVersion: 0
      }]);
      setInput('');
      setLoading(false);
      setRetryInfo(null);
      setEditingIndex(null);
      setEditText('');
    },
    // Adicionar mensagem programaticamente
    addMessage: (role, content) => {
      setMessages(prev => [...prev, {
        role,
        versions: [{ content }],
        activeVersion: 0
      }]);
    },
    // Obter histórico de mensagens (versão ativa de cada uma)
    getHistory: () => {
      return messages.map(msg => ({
        role: msg.role,
        content: msg.versions[msg.activeVersion].content
      }));
    },
    // Enviar mensagem programaticamente
    sendMessage: (message) => {
      if (message && !loading) {
        setInput(message);
        // Trigger submit no próximo tick
        setTimeout(() => {
          inputRef.current?.form?.requestSubmit();
        }, 0);
      }
    }
  }), [messages, loading, initialMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focar input quando bot responder
  useEffect(() => {
    if (!loading && messages.length > 0 && editingIndex === null) {
      inputRef.current?.focus();
    }
  }, [loading, messages.length, editingIndex]);

  // Focar input de edição
  useEffect(() => {
    if (editingIndex !== null) {
      editInputRef.current?.focus();
    }
  }, [editingIndex]);

  // Handler para clicks fora do balão em edição
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingIndex !== null && containerRef.current) {
        const editingBubble = containerRef.current.querySelector(`[data-editing="true"]`);
        if (editingBubble && !editingBubble.contains(e.target)) {
          setEditingIndex(null);
          setEditText('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingIndex]);

  const sendMessage = async (userMessage) => {
    setLoading(true);
    setRetryInfo(null);

    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          setRetryInfo({ attempt, maxAttempts: maxRetries });
        }

        const response = await onSendMessage(userMessage);
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          versions: [{ content: response }],
          activeVersion: 0
        }]);
        setRetryInfo(null);
        setLoading(false);
        return;
      } catch (error) {
        lastError = error.message || 'Erro desconhecido';
        
        // Se for erro de autenticação, não tentar novamente
        if (error.status === 401 || error.status === 400) {
          break;
        }
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    setMessages(prev => [...prev, { 
      role: 'assistant', 
      versions: [{ content: `⚠️ Erro: ${lastError || 'Não foi possível processar sua pergunta.'}` }],
      activeVersion: 0
    }]);
    setRetryInfo(null);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      versions: [{ content: userMessage }],
      activeVersion: 0
    }]);

    await sendMessage(userMessage);
  };

  const handleStartEdit = (index) => {
    const msg = messages[index];
    if (msg.role !== 'user' || loading) return;
    
    setEditingIndex(index);
    setEditText(msg.versions[msg.activeVersion].content);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  const handleSubmitEdit = async () => {
    if (!editText.trim() || loading) return;
    
    const editedText = editText.trim();
    const editIndex = editingIndex;
    
    // Salvar mensagens subsequentes na versão atual, e criar nova versão
    setMessages(prev => {
      const editedMsg = { ...prev[editIndex] };
      const currentVersionIdx = editedMsg.activeVersion;
      
      // Pegar todas as mensagens que vieram depois desta
      const followUpMessages = prev.slice(editIndex + 1);
      
      // Salvar essas mensagens na versão atual
      const updatedVersions = [...editedMsg.versions];
      updatedVersions[currentVersionIdx] = {
        ...updatedVersions[currentVersionIdx],
        followUps: followUpMessages
      };
      
      // Criar nova versão com a pergunta editada
      updatedVersions.push({ content: editedText });
      
      editedMsg.versions = updatedVersions;
      editedMsg.activeVersion = updatedVersions.length - 1;
      
      // Retornar apenas até a mensagem editada
      const newMessages = prev.slice(0, editIndex);
      newMessages.push(editedMsg);
      return newMessages;
    });

    setEditingIndex(null);
    setEditText('');

    await sendMessage(editedText);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const navigateVersion = (msgIndex, direction) => {
    setMessages(prev => {
      const msg = { ...prev[msgIndex] };
      const currentVersionIdx = msg.activeVersion;
      const newVersionIdx = currentVersionIdx + direction;
      
      if (newVersionIdx < 0 || newVersionIdx >= msg.versions.length) {
        return prev;
      }
      
      // Se é uma mensagem de usuário, gerenciar os followUps
      if (msg.role === 'user') {
        // Salvar as mensagens subsequentes atuais na versão atual
        const currentFollowUps = prev.slice(msgIndex + 1);
        const updatedVersions = [...msg.versions];
        updatedVersions[currentVersionIdx] = {
          ...updatedVersions[currentVersionIdx],
          followUps: currentFollowUps
        };
        
        msg.versions = updatedVersions;
        msg.activeVersion = newVersionIdx;
        
        // Restaurar os followUps da nova versão
        const newVersionFollowUps = msg.versions[newVersionIdx].followUps || [];
        
        const newMessages = prev.slice(0, msgIndex);
        newMessages.push(msg);
        newMessages.push(...newVersionFollowUps);
        
        return newMessages;
      }
      
      // Para mensagens do assistant, apenas muda a versão
      msg.activeVersion = newVersionIdx;
      const newMessages = [...prev];
      newMessages[msgIndex] = msg;
      return newMessages;
    });
  };

  return (
    <div className={`${styles.container} ${className}`} ref={containerRef}>
      <div className={styles.messages}>
        {messages.map((msg, index) => {
          const isEditing = editingIndex === index;
          const hasMultipleVersions = msg.versions.length > 1;
          const currentContent = msg.versions[msg.activeVersion].content;
          
          return (
            <div 
              key={index} 
              className={`${styles.message} ${isEditing ? styles.editing : ''}`}
              data-role={msg.role}
              data-editing={isEditing}
            >
              {retryInfo && index === messages.length - 1 && (
                <div className={styles.retryInfo}>
                  🔄 Tentativa {retryInfo.attempt}/{retryInfo.maxAttempts}...
                </div>
              )}
              <div className={styles.avatar}>
                {msg.role === 'user' ? userAvatar : assistantAvatar}
              </div>
              <div 
                className={`${styles.bubble} ${isEditing ? styles.bubbleEditing : ''}`}
                onClick={() => !isEditing && msg.role === 'user' && handleStartEdit(index)}
                style={{ cursor: msg.role === 'user' && !isEditing ? 'pointer' : 'default' }}
              >
                {isEditing ? (
                  <div className={styles.editContainer}>
                    <textarea
                      ref={editInputRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      className={styles.editInput}
                      rows={3}
                    />
                    <div className={styles.editActions}>
                      <button 
                        className={styles.editCancel}
                        onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                      >
                        Cancelar
                      </button>
                      <button 
                        className={styles.editSubmit}
                        onClick={(e) => { e.stopPropagation(); handleSubmitEdit(); }}
                        disabled={!editText.trim()}
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.content}>
                      {currentContent.split('\n').map((line, i) => (
                        <p 
                          key={i} 
                          dangerouslySetInnerHTML={{ __html: parseMarkdown(line) }}
                        />
                      ))}
                    </div>
                    {hasMultipleVersions && (
                      <div className={styles.versionNav}>
                        <button 
                          className={styles.versionBtn}
                          onClick={(e) => { e.stopPropagation(); navigateVersion(index, -1); }}
                          disabled={msg.activeVersion === 0}
                        >
                          <ChevronLeft />
                        </button>
                        <span className={styles.versionCounter}>
                          {msg.activeVersion + 1}/{msg.versions.length}
                        </span>
                        <button 
                          className={styles.versionBtn}
                          onClick={(e) => { e.stopPropagation(); navigateVersion(index, 1); }}
                          disabled={msg.activeVersion === msg.versions.length - 1}
                        >
                          <ChevronRight />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
        
        {loading && (
          <div className={styles.message} data-role="assistant">
            <div className={styles.avatar}>{assistantAvatar}</div>
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

      {messages.length === 1 && suggestions.length > 0 && (
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
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={placeholder}
          className={styles.input}
          disabled={loading}
          rows={1}
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
});

export default Chat;
