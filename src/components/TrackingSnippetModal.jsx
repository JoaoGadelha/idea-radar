import { useState } from 'react';
import styles from './TrackingSnippetModal.module.css';

/**
 * Modal que exibe o snippet de tracking GA4 para LPs externas
 * Permite ao usuário copiar o código facilmente
 */
export default function TrackingSnippetModal({ project, onClose }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' or 'advanced'

  const GA_MEASUREMENT_ID = 'G-P13EMWM4H3';

  // Snippet básico (só GA4)
  const basicSnippet = `<!-- IdeaRadar Tracking - ${project.name} -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_MEASUREMENT_ID}', {
    'project_id': '${project.id}'
  });
</script>`;

  // Snippet avançado (com eventos de conversão)
  const advancedSnippet = `<!-- IdeaRadar Tracking - ${project.name} -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_MEASUREMENT_ID}', {
    'project_id': '${project.id}'
  });

  // Função helper para trackear eventos
  window.ideaRadarTrack = function(eventName, params) {
    gtag('event', eventName, {
      ...params,
      project_id: '${project.id}'
    });
  };

  // Exemplo: Trackear clique no CTA
  // ideaRadarTrack('cta_click', { cta_text: 'Começar agora' });

  // Exemplo: Trackear conversão (lead)
  // ideaRadarTrack('generate_lead', { method: 'email_form' });
</script>`;

  const currentSnippet = activeTab === 'basic' ? basicSnippet : advancedSnippet;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
      // Fallback para browsers antigos
      const textarea = document.createElement('textarea');
      textarea.value = currentSnippet;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>📊 Código de Rastreamento</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            Cole este código no <code>&lt;head&gt;</code> da sua landing page externa para 
            rastrear métricas no IdeaRadar.
          </p>

          <div className={styles.projectInfo}>
            <strong>Projeto:</strong> {project.name}
            {project.url && (
              <>
                <br />
                <strong>URL:</strong> <a href={project.url} target="_blank" rel="noopener noreferrer">{project.url}</a>
              </>
            )}
          </div>

          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'basic' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              Básico
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'advanced' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('advanced')}
            >
              Avançado
            </button>
          </div>

          <div className={styles.snippetContainer}>
            <pre className={styles.snippet}>
              <code>{currentSnippet}</code>
            </pre>
            <button 
              className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
              onClick={handleCopy}
            >
              {copied ? '✓ Copiado!' : '📋 Copiar'}
            </button>
          </div>

          {activeTab === 'advanced' && (
            <div className={styles.instructions}>
              <h4>Como usar os eventos:</h4>
              <ul>
                <li>
                  <strong>Clique no CTA:</strong>
                  <code>ideaRadarTrack('cta_click', {'{'} cta_text: 'Seu texto' {'}'});</code>
                </li>
                <li>
                  <strong>Lead capturado:</strong>
                  <code>ideaRadarTrack('generate_lead', {'{'} method: 'email_form' {'}'});</code>
                </li>
                <li>
                  <strong>Scroll 50%:</strong>
                  <code>ideaRadarTrack('scroll', {'{'} percent_scrolled: 50 {'}'});</code>
                </li>
              </ul>
            </div>
          )}

          <div className={styles.tips}>
            <h4>💡 Dicas:</h4>
            <ul>
              <li>O código deve ser inserido antes de fechar a tag <code>&lt;/head&gt;</code></li>
              <li>As métricas podem levar até 24h para aparecer na análise</li>
              <li>Use o snippet avançado se quiser trackear conversões manualmente</li>
            </ul>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.closeBtn} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
