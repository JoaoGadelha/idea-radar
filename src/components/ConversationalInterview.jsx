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
    setShowChat,
  } = useLandingPageCreation();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef(null);

  // Verificar se API key existe
  useEffect(() => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      console.error('❌ VITE_GEMINI_API_KEY não configurada no .env');
    }
  }, []);

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
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ API Key não encontrada');
      return {
        message: 'Ótima pergunta! Os campos principais são:\n\n📝 **Nome do projeto**\n💡 **Descrição** (o que faz, para quem serve)\n🎯 **Benefícios principais**\n🎨 **Cor da marca** (opcional)\n\nTambém posso coletar pricing, depoimentos e garantia, mas são opcionais!\n\nPode colar uma descrição completa do seu projeto ou ir me contando aos poucos. Como prefere começar?',
        isComplete: false,
      };
    }
    
    try {
      const prompt = `Você é um assistente especializado em coletar informações para criar landing pages.

DADOS JÁ COLETADOS:
${JSON.stringify(collectedData, null, 2)}

HISTÓRICO DA CONVERSA:
${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

NOVA MENSAGEM DO USUÁRIO:
${userMessage}

INSTRUÇÕES:
1. Se o usuário está PERGUNTANDO sobre o processo (ex: "que campos?", "o que preciso?"):
   - Explique de forma clara e amigável
   - Liste os campos principais: Nome do projeto, Descrição/O que faz, Público-alvo, Benefícios
   - Mencione que pricing, depoimentos e garantia são opcionais
   - Diga que pode colar tudo de uma vez ou ir por partes

2. Se o usuário está FORNECENDO INFORMAÇÕES:
   - Extraia TODOS os dados mencionados
   - Confirme o que entendeu
   - Pergunte o próximo campo importante

3. Se o usuário disse "não sei" ou "depois":
   - Aceite tranquilamente
   - Pergunte o próximo campo essencial

CAMPOS PRINCIPAIS (prioridade):
- title: Nome do produto/serviço
- brief: O que faz, para quem serve, principais funcionalidades
- primary_color: Cor da marca (opcional)

CAMPOS OPCIONAIS:
- pricing_plans: Planos e preços
- testimonials: Depoimentos de clientes
- guarantee: Garantia (ex: 30 dias)
- features: Funcionalidades específicas
- stats: Estatísticas (ex: "500+ usuários")

RESPONDA SEMPRE EM JSON VÁLIDO:
{
  "extractedData": {},
  "missingFields": ["title", "brief"],
  "nextQuestion": "Qual o próximo passo ou pergunta",
  "isComplete": false,
  "acknowledgment": "Sua resposta natural e amigável"
}

EXEMPLOS:
Usuário: "que campos preciso preencher?"
→ acknowledgment: "Ótima pergunta! Os campos principais são:\n\n📝 Nome do projeto\n💡 Descrição (o que faz, para quem serve)\n🎨 Cor principal (opcional)\n\nTambém posso coletar pricing, depoimentos e garantia, mas são opcionais!\n\nPode colar uma descrição completa ou ir me contando aos poucos. Como prefere começar?"

Usuário: "FitPlate, app de nutrição"
→ extractedData: {"title": "FitPlate", "brief": "App de nutrição"}
→ acknowledgment: "Legal! FitPlate - app de nutrição. Me conta mais: para quem é esse app e quais são os principais benefícios?"`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Gemini API Error:', response.status, errorData);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.candidates[0]?.content?.parts[0]?.text || '';
      
      console.log('[AI Response]', aiText);
      
      // Extrair JSON da resposta
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        
        console.log('[Extracted Result]', result);
        
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
          message: result.acknowledgment + (result.isComplete ? '' : (result.nextQuestion ? '\n\n' + result.nextQuestion : '')),
          isComplete: result.isComplete,
        };
      }

      console.log('[JSON Parse Failed] No JSON found in response');
      
      return {
        message: 'Ótima pergunta! Os campos principais são:\n\n📝 **Nome do projeto**\n💡 **Descrição** (o que faz, para quem serve)\n🎯 **Benefícios principais**\n🎨 **Cor da marca** (opcional)\n\nTambém posso coletar pricing, depoimentos e garantia, mas são opcionais!\n\nPode colar uma descrição completa do seu projeto ou ir me contando aos poucos. Como prefere começar?',
        isComplete: false,
      };

    } catch (error) {
      console.error('Erro ao processar com Gemini:', error);
      return {
        message: 'Ótima pergunta! Me conta sobre seu projeto: qual o nome, o que ele faz e para quem serve? Pode ser uma descrição curta ou longa, como preferir! 😊',
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
    setShowChat(false);
  };

  const handleClose = () => {
    setShowChat(false);
  };

  const handleReset = () => {
    if (chatHistory.length <= 1) return; // Não resetar se só tem mensagem inicial
    
    if (confirm('Deseja reiniciar a conversa? Os dados já coletados serão mantidos.')) {
      // Manter apenas a mensagem inicial
      const initialMessage = chatHistory[0];
      addChatMessage({ role: 'reset', content: '' }); // Flag para limpar
      
      // Resetar estado local
      setIsTyping(false);
      setIsComplete(false);
      setInput('');
      
      // Adicionar mensagem de reset
      setTimeout(() => {
        addChatMessage({
          role: 'ai',
          content: '🔄 Conversa reiniciada! Vamos começar de novo. Me conta sobre seu projeto!'
        });
      }, 300);
    }
  };

  return (
    <div className={styles.container} onClick={handleClose}>
      <div className={styles.chatWindow} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.aiIcon}>🤖</div>
            <div className={styles.headerText}>
              <h2>Assistente de Landing Page</h2>
              <p>Conte-me sobre seu projeto</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button 
              className={styles.resetButton} 
              onClick={handleReset}
              disabled={chatHistory.length <= 1}
              title="Reiniciar conversa"
            >
              🔄
            </button>
            <button className={styles.closeButton} onClick={handleClose}>
              ✕
            </button>
          </div>
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
