import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './ChatInterface.module.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Parser simples de markdown
function parseMarkdown(text) {
  return text
    // Bold: **texto**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic: *texto*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code: `texto`
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Quote: "texto" (aspas duplas viram blockquote com estilo inline)
    .replace(/"([^"]{20,})"/g, '<div style="margin: 8px 0; padding: 12px 16px; background: rgba(99, 102, 241, 0.1); border-left: 4px solid #6366f1; border-radius: 0 8px 8px 0; font-style: italic; color: #a5b4fc;">"$1"</div>');
}

export default function ChatInterface({ projectsCount }) {
  const { token } = useAuth();
  // Cada mensagem agora tem: role, versions: [content1, content2...], activeVersion: index
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      versions: [`Olá! 👋 Sou seu analista de projetos com IA. Tenho acesso aos dados de **${projectsCount} projeto(s)** seus.\n\nPergunte-me coisas como:\n• "Como estão meus projetos?"\n• "Qual projeto está melhor?"\n• "Por que o projeto X está ruim?"\n• "Onde devo investir meu tempo?"`],
      activeVersion: 0
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryInfo, setRetryInfo] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null); // índice da mensagem em edição
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const editInputRef = useRef(null);
  const containerRef = useRef(null);

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

  const sendMessage = async (userMessage, insertAfterIndex = null) => {
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
            versions: [data.answer],
            activeVersion: 0
          }]);
          setRetryInfo(null);
          setLoading(false);
          return;
        } else {
          lastError = data.message || data.error;
          if (response.status === 401 || response.status === 400) {
            break;
          }
        }
      } catch (error) {
        lastError = 'Erro de conexão';
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    setMessages(prev => [...prev, { 
      role: 'assistant', 
      versions: [`⚠️ Erro: ${lastError || 'Não foi possível processar sua pergunta.'}`],
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
      versions: [userMessage],
      activeVersion: 0
    }]);

    await sendMessage(userMessage);
  };

  const handleStartEdit = (index) => {
    const msg = messages[index];
    if (msg.role !== 'user' || loading) return;
    
    setEditingIndex(index);
    setEditText(msg.versions[msg.activeVersion]);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  const handleSubmitEdit = async () => {
    if (!editText.trim() || loading) return;
    
    const editedText = editText.trim();
    const editIndex = editingIndex;
    
    // Adicionar nova versão à mensagem editada
    setMessages(prev => {
      const newMessages = prev.slice(0, editIndex + 1);
      const editedMsg = { ...newMessages[editIndex] };
      editedMsg.versions = [...editedMsg.versions, editedText];
      editedMsg.activeVersion = editedMsg.versions.length - 1;
      newMessages[editIndex] = editedMsg;
      return newMessages;
    });

    setEditingIndex(null);
    setEditText('');

    // Enviar nova pergunta
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
      const newMessages = [...prev];
      const msg = { ...newMessages[msgIndex] };
      const newVersion = msg.activeVersion + direction;
      
      if (newVersion >= 0 && newVersion < msg.versions.length) {
        msg.activeVersion = newVersion;
        newMessages[msgIndex] = msg;
      }
      
      return newMessages;
    });
  };

  const suggestions = [
    'Como estão meus projetos?',
    'Qual projeto está melhor?',
    'Onde devo focar?',
    'Analise as taxas de conversão'
  ];

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.messages}>
        {messages.map((msg, index) => {
          const isEditing = editingIndex === index;
          const hasMultipleVersions = msg.versions.length > 1;
          const currentContent = msg.versions[msg.activeVersion];
          
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
                {msg.role === 'user' ? '👤' : '🤖'}
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
                          <FaChevronLeft />
                        </button>
                        <span className={styles.versionCounter}>
                          {msg.activeVersion + 1}/{msg.versions.length}
                        </span>
                        <button 
                          className={styles.versionBtn}
                          onClick={(e) => { e.stopPropagation(); navigateVersion(index, 1); }}
                          disabled={msg.activeVersion === msg.versions.length - 1}
                        >
                          <FaChevronRight />
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
          placeholder="Pergunte sobre seus projetos... (Shift+Enter para nova linha)"
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
}
