import { useAuth } from '../contexts/AuthContext';
import { Chat } from './Chat';

/**
 * ChatInterface - Wrapper do componente Chat para o projeto IdeaRadar
 * Integra o Chat genérico com a autenticação e API específica do projeto
 */
export default function ChatInterface({ projectsCount }) {
  const { token } = useAuth();

  // Função que envia mensagem para a API do IdeaRadar
  const handleSendMessage = async (message) => {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question: message })
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Erro desconhecido');
      error.status = response.status;
      throw error;
    }

    return data.answer;
  };

  const initialMessage = `Olá! 👋 Sou seu analista de projetos com IA. Tenho acesso aos dados de **${projectsCount} projeto(s)** seus.\n\nPergunte-me coisas como:\n• "Como estão meus projetos?"\n• "Qual projeto está melhor?"\n• "Por que o projeto X está ruim?"\n• "Onde devo investir meu tempo?"`;

  const suggestions = [
    'Como estão meus projetos?',
    'Qual projeto está melhor?',
    'Onde devo focar?',
    'Analise as taxas de conversão'
  ];

  return (
    <Chat
      onSendMessage={handleSendMessage}
      initialMessage={initialMessage}
      suggestions={suggestions}
      placeholder="Pergunte sobre seus projetos... (Shift+Enter para nova linha)"
      userAvatar="👤"
      assistantAvatar="🤖"
      maxRetries={3}
      retryDelay={1500}
    />
  );
}
