import { useLandingPageCreation } from '../contexts/LandingPageCreationContext';
import styles from './CreationModeSelector.module.css';

export default function CreationModeSelector() {
  const { setShowModeSelector, setShowChat } = useLandingPageCreation();

  const handleChatMode = () => {
    setShowModeSelector(false);
    setShowChat(true);
  };

  const handleManualMode = () => {
    setShowModeSelector(false);
  };

  return (
    <div className={styles.overlay} onClick={handleManualMode}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Como prefere criar sua Landing Page?</h2>
          <p>Escolha o método que melhor se adapta a você</p>
        </div>

        <div className={styles.options}>
          {/* Opção 1: Chat AI */}
          <button className={styles.option} onClick={handleChatMode}>
            <div className={styles.optionIcon}>🤖</div>
            <div className={styles.optionContent}>
              <h3 className={styles.optionTitle}>
                Criar com Assistente AI
                <span className={styles.badge}>Recomendado</span>
              </h3>
              <p className={styles.optionDescription}>
                Converse naturalmente com nossa IA e ela cria tudo para você
              </p>
              <ul className={styles.optionFeatures}>
                <li>Mais rápido e fácil</li>
                <li>Aceita descrições longas ou curtas</li>
                <li>Faz perguntas inteligentes</li>
                <li>Extrai dados automaticamente</li>
              </ul>
            </div>
          </button>

          {/* Opção 2: Manual */}
          <button className={styles.option} onClick={handleManualMode}>
            <div className={styles.optionIcon}>⚡</div>
            <div className={styles.optionContent}>
              <h3 className={styles.optionTitle}>Modo Manual</h3>
              <p className={styles.optionDescription}>
                Preencha os campos do formulário tradicional
              </p>
              <ul className={styles.optionFeatures}>
                <li>Controle total sobre cada campo</li>
                <li>Interface familiar</li>
                <li>Ótimo se já souber exatamente o que quer</li>
              </ul>
            </div>
          </button>
        </div>

        <button className={styles.closeButton} onClick={handleManualMode}>
          ✕
        </button>
      </div>
    </div>
  );
}
