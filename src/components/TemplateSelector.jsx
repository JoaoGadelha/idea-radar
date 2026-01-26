import { useState } from 'react';
import styles from './TemplateSelector.module.css';

const TEMPLATES = [
  {
    id: 'claude',
    name: 'Claude',
    description: 'Profissional e suave',
    features: ['Glassmorphism', 'Roxo/Indigo', 'Muito espaço'],
    preview: '#6366f1',
    rating: 5,
    bestFor: 'SaaS B2B, Empresas'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Minimalista extremo',
    features: ['Tipografia gigante', 'Preto/Branco', 'Ultra limpo'],
    preview: '#000000',
    rating: 5,
    bestFor: 'Fintech, Dev Tools'
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Dark mode elegante',
    features: ['Cores neon', 'Glow effects', 'Futurista'],
    preview: 'linear-gradient(135deg, #00d9ff 0%, #a855f7 100%)',
    rating: 4,
    bestFor: 'Tech, Gaming, Startups'
  },
  {
    id: 'gradient',
    name: 'Gradient',
    description: 'Colorido e moderno',
    features: ['Mesh gradients', 'Vibrante', 'Muito arredondado'],
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f5576c 100%)',
    rating: 5,
    bestFor: 'Lifestyle, Criativo'
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'Ousado e geométrico',
    features: ['Borders grossos', 'Cantos retos', 'Cores puras'],
    preview: 'linear-gradient(45deg, #ffff00 0%, #ffff00 50%, #000000 50%, #000000 100%)',
    rating: 4,
    bestFor: 'Fashion, Arte'
  },
  {
    id: 'soft',
    name: 'Soft',
    description: 'Suave e amigável',
    features: ['Cores pastel', 'Muito arredondado', 'Soft shadows'],
    preview: 'linear-gradient(135deg, #ff6b9d 0%, #84a9ff 100%)',
    rating: 5,
    bestFor: 'Educação, Saúde'
  }
];

export default function TemplateSelector({ currentTemplate = 'claude', onTemplateChange, onClose, darkMode = false }) {
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate);

  const handleApply = () => {
    onTemplateChange(selectedTemplate);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${darkMode ? styles.darkMode : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Escolher Template</h2>
            <p className={styles.subtitle}>
              Selecione o estilo visual da sua landing page
            </p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Templates Grid */}
        <div className={styles.templatesGrid}>
          {TEMPLATES.map((template) => (
            <label
              key={template.id}
              className={`${styles.templateCard} ${
                selectedTemplate === template.id ? styles.selected : ''
              }`}
            >
              <input
                type="radio"
                name="template"
                value={template.id}
                checked={selectedTemplate === template.id}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className={styles.radio}
              />

              {/* Preview Color */}
              <div
                className={styles.preview}
                style={{ background: template.preview }}
              />

              {/* Template Info */}
              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <h3 className={styles.name}>{template.name}</h3>
                  <div className={styles.rating}>
                    {'★'.repeat(template.rating)}
                    {'☆'.repeat(5 - template.rating)}
                  </div>
                </div>
                <p className={styles.description}>{template.description}</p>

                {/* Features */}
                <ul className={styles.features}>
                  {template.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>

                {/* Best For */}
                <div className={styles.bestFor}>
                  <span className={styles.bestForLabel}>Ideal para:</span>
                  <span className={styles.bestForText}>{template.bestFor}</span>
                </div>
              </div>

              {/* Selected Indicator */}
              {selectedTemplate === template.id && (
                <div className={styles.selectedBadge}>
                  <span>✓</span> Selecionado
                </div>
              )}
            </label>
          ))}
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.applyButton} onClick={handleApply}>
            Aplicar Template
          </button>
        </div>
      </div>
    </div>
  );
}
