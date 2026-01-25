import { useState, useEffect, useRef } from 'react';
import { useLandingPageCreation } from '../contexts/LandingPageCreationContext';
import styles from './ConversationalInterview.module.css';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function ConversationalInterview() {
  const {
    chatHistory,
    addChatMessage,
    collectedData,
    updateCollectedData,
    setCurrentView,
  } = useLandingPageCreation();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Mensagem inicial da AI
    if (chatHistory.length === 0) {
      setTimeout(() => {
        addChatMessage({
          role: 'ai',
          content: 'Oi! 👋 Vou te ajudar a criar uma landing page incrível. Me conta sobre seu projeto - pode ser uma descrição breve ou colar tudo que você tiver! O que seu produto/serviço faz?',
        });
      }, 500);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const extractDataFromResponse = async (userMessage) => {
    try {
      const prompt = `Você é um assistente especializado em extrair informações de landing pages de produtos/serviços.

DADOS JÁ COLETADOS:
${JSON.stringify(collectedData, null, 2)}

HISTÓRICO DA CONVERSA:
${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

NOVA MENSAGEM DO USUÁRIO:
${userMessage}

TAREFA:
1. Extraia TODAS as informações relevantes da mensagem do usuário
2. Atualize os campos que foram mencionados
3. Identifique o que AINDA FALTA coletar
4. Gere uma resposta natural e conversacional

CAMPOS PARA EXTRAIR (se mencionados):
- title: Nome do produto/serviço
- brief: Descrição detalhada
- pricing_plans: Array de {name, price, features[]}
- testimonials: Array de {name, role, quote, rating}
- guarantee: {days, description}
- features: Lista de funcionalidades
- stats: Array de {value, label} (ex: "500+ usuários")
- primary_color: Cor principal (nome ou hex)
- hero_image_type: 'url', 'ai', 'upload', 'none'
- showcase_type: 'about', 'product', 'both', 'none'

RESPONDA EM JSON:
{
  "extractedData": { /* campos extraídos */ },
  "missingFields": ["campo1", "campo2"],
  "nextQuestion": "Pergunta natural para coletar próximo campo importante",
  "isComplete": false, /* true se tem dados suficientes para gerar LP */
  "acknowledgment": "Resposta confirmando o que entendeu"
}

IMPORTANTE:
- Se o usuário colou descrição completa, extraia TUDO de uma vez
- Seja conversacional e amigável
- Priorize coletar: title, brief, pricing (se aplicável)
- Se já tiver o essencial, pergunte coisas opcionais
- Seja flexível: aceite "não tenho" ou "depois"`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
            }
          }),
        }
      );

      const data = await response.json();
      const aiText = data.candidates[0]?.content?.parts[0]?.text || '';
      
      // Extrair JSON da resposta
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        
        // Atualizar dados coletados
        if (result.extractedData && Object.keys(result.extractedData).length > 0) {
          updateCollectedData(result.extractedData);
        }

        // Auto-gerar slug se title foi fornecido
        if (result.extractedData?.title && !collectedData.slug) {
          const slug = result.extractedData.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          updateCollectedData({ slug });
        }

        // Verificar se está completo
        if (result.isComplete) {
          setIsComplete(true);
        }

        return {
          message: result.acknowledgment + '\n\n' + (result.isComplete ? '✨ Perfeito! Já tenho tudo que preciso para criar sua landing page!' : result.nextQuestion),
          isComplete: result.isComplete,
        };
      }

      return {
        message: 'Entendi! Me conta mais um pouco...',
        isComplete: false,
      };

    } catch (error) {
      console.error('Erro ao processar com Gemini:', error);
      return {
        message: 'Entendi! Pode me contar mais sobre seu projeto?',
        isComplete: false,
      };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');

    // Adicionar mensagem do usuário
    addChatMessage({ role: 'user', content: userMessage });

    // AI está pensando
    setIsTyping(true);

    // Processar com AI
    const { message, isComplete } = await extractDataFromResponse(userMessage);

    setTimeout(() => {
      addChatMessage({ role: 'ai', content: message });
      setIsTyping(false);
      
      if (isComplete) {
        setIsComplete(true);
      }
    }, 800);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const calculateProgress = () => {
    const fields = ['title', 'brief'];
    const filled = fields.filter(f => collectedData[f]).length;
    return Math.min((filled / fields.length) * 100, 100);
  };

  const handleContinueToBuilder = () => {
    setCurrentView('builder');
  };

  return (
    <div className={styles.container}>
      <div className={styles.chatWindow}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.aiIcon}>🤖</div>
            <div className={styles.headerText}>
              <h2>Assistente de Landing Page</h2>
              <p>Conte-me sobre seu projeto</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={() => setCurrentView('choice')}>
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressLabel}>
            <span>Progresso da coleta</span>
            <span>{Math.round(calculateProgress())}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${calculateProgress()}%` }} />
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messagesContainer}>
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`${styles.message} ${msg.role === 'ai' ? styles.messageAi : styles.messageUser}`}
            >
              <div className={`${styles.messageAvatar} ${msg.role === 'ai' ? styles.aiAvatar : styles.userAvatar}`}>
                {msg.role === 'ai' ? '🤖' : '👤'}
              </div>
              <div className={styles.messageContent}>
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className={`${styles.message} ${styles.messageAi}`}>
              <div className={`${styles.messageAvatar} ${styles.aiAvatar}`}>🤖</div>
              <div className={styles.messageContent}>
                <div className={styles.typing}>
                  <div className={styles.typingDot}></div>
                  <div className={styles.typingDot}></div>
                  <div className={styles.typingDot}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={styles.inputArea}>
          {isComplete && (
            <button className={styles.continueButton} onClick={handleContinueToBuilder}>
              ✨ Continuar para o Builder →
            </button>
          )}
          
          <div className={styles.inputGroup}>
            <textarea
              className={styles.textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem ou cole a descrição completa..."
              rows={1}
              disabled={isTyping}
            />
            <button
              className={styles.sendButton}
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
            >
              Enviar 📤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
