import { useState, useEffect, useRef } from 'react';
import styles from './LandingPageBuilder.module.css';
import LandingPagePreview from './LandingPagePreview';
import TemplateSelector from './TemplateSelector';
import { useAuth } from '../contexts/AuthContext';

// Templates com cor fixa (não permitem customização)
const TEMPLATES_WITH_FIXED_COLOR = {
  soft: '#ff9e9e',
  // Futuros templates com cores fixas:
  // 'blue-corporate': '#0066cc',
  // 'green-eco': '#00cc66',
};

export default function LandingPageBuilder({ onClose, onSave }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const previewRef = useRef(null);
  const inputsRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    brief: '',
    primary_color: '#10b981',
    template: 'claude', // Template padrão
    collect_name: true,
    collect_phone: false,
    collect_suggestions: true,
  });

  // Retorna a cor efetiva (fixa ou customizável)
  const getEffectiveColor = () => {
    return TEMPLATES_WITH_FIXED_COLOR[formData.template] || formData.primary_color;
  };

  // Scroll to top on mount
  useEffect(() => {
    // Usar setTimeout para garantir que o DOM está completamente renderizado
    const timer = setTimeout(() => {
      if (previewRef.current) {
        previewRef.current.scrollTop = 0;
      }
      if (inputsRef.current) {
        inputsRef.current.scrollTop = 0;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Scroll preview to top when variations change
  useEffect(() => {
    if (variations.length > 0 && previewRef.current) {
      previewRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [variations, selectedIndex]);

  // Verifica se o template atual tem cor fixa
  const hasFixedColor = () => {
    return formData.template in TEMPLATES_WITH_FIXED_COLOR;
  };

  // DEV: Preencher com exemplo do Termômetro de Clima Digital
  const handleDevPopulate = () => {
    setFormData({
      ...formData,
      title: 'Termômetro de Clima Digital',
      slug: 'termometro-clima-digital',
      brief: 'Projeto Termômetro de Clima Digital: esta landing page apresenta uma plataforma interativa criada para medir, em tempo real, o nível de engajamento e satisfação do público em relação a uma nova campanha digital. A ideia do projeto é funcionar como um "termômetro" simbólico, no qual os usuários respondem a microinterações rápidas — como enquetes, reações visuais e perguntas de pulso emocional — que alimentam um indicador dinâmico exibido na tela. A página tem foco em design limpo, linguagem acessível e chamadas claras para participação, transformando a coleta de percepção em uma experiência leve e visualmente atrativa. Os dados coletados são consolidados para ajudar marcas a entenderem a temperatura do interesse do público, ajustando estratégias de comunicação de forma ágil e orientada por insights reais.',
    });
  };

  const handleGenerate = async () => {
    if (!formData.title || !formData.brief) {
      alert('Preencha o título e a descrição do projeto');
      return;
    }

    setLoading(true);
    try {
      // Usar dados do formulário diretamente
      const projectData = {
        name: formData.title,
        description: formData.brief,
      };

      console.log('[LandingPageBuilder] Enviando para API:', { projectData, brief: formData.brief });

      // Gerar variações
      const res = await fetch('/api/landing-pages/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectData,
          brief: formData.brief,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao gerar landing pages');
      }

      const data = await res.json();
      setVariations(prev => [...prev, data.variation]);
      setSelectedIndex(variations.length);
    } catch (error) {
      console.error('Erro ao gerar:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const selectedVariation = variations[selectedIndex];
    if (!selectedVariation) return;

    try {
      // Criar projeto + landing page em uma única chamada
      const res = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          // Dados para criar projeto automaticamente
          project_name: formData.title,
          project_description: formData.brief,
          // Dados da landing page
          slug: formData.slug,
          title: formData.title || selectedVariation.headline,
          headline: selectedVariation.headline,
          subheadline: selectedVariation.subheadline,
          description: selectedVariation.description,
          cta_text: selectedVariation.cta_text,
          value_proposition: selectedVariation.value_proposition,
          how_it_works: selectedVariation.how_it_works,
          faq_items: selectedVariation.faq_items,
          cta_headline: selectedVariation.cta_headline,
          cta_subheadline: selectedVariation.cta_subheadline,
          primary_color: getEffectiveColor(),
          template: formData.template,
          collect_name: formData.collect_name,
          collect_phone: formData.collect_phone,
          collect_suggestions: formData.collect_suggestions,
          status: 'draft',
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      const { landingPage } = await res.json();
      onSave(landingPage);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert(error.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Nova Landing Page</h2>
          <button 
            onClick={handleDevPopulate} 
            className={styles.devBtn}
            title="Preencher com exemplo"
          >
            🧪 DEV
          </button>
        </div>
        <button onClick={onClose} className={styles.closeBtn}>✕</button>
      </div>

      <div className={styles.content}>
        {/* Input Section */}
        <div className={styles.inputs} ref={inputsRef}>
          <div className={styles.inputGroup}>
            <label>Título da LP</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nome interno da landing page"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Slug (URL)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              placeholder="minha-landing-page"
              required
            />
            <small>app.com/l/{formData.slug || 'slug'}</small>
          </div>

          <div className={styles.inputGroup}>
            <label>Descreva sua ideia de produto/serviço</label>
            <textarea
              value={formData.brief}
              onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
              placeholder="Ex: App de delivery vegano para universitários, Curso online de Python para iniciantes, Consultoria financeira para MEIs..."
              rows="5"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Template Visual</label>
            <button
              type="button"
              className={styles.templateButton}
              onClick={() => setShowTemplateSelector(true)}
            >
              <span className={styles.templateIcon}>
                {formData.template === 'claude' && '🎨'}
                {formData.template === 'stripe' && '⚡'}
                {formData.template === 'vercel' && '🌙'}
                {formData.template === 'gradient' && '🌈'}
                {formData.template === 'brutalist' && '⬛'}
                {formData.template === 'soft' && '🧸'}
              </span>
              <span className={styles.templateName}>
                {formData.template === 'claude' && 'Claude - Profissional'}
                {formData.template === 'stripe' && 'Stripe - Minimalista'}
                {formData.template === 'vercel' && 'Vercel - Dark Mode'}
                {formData.template === 'gradient' && 'Gradient - Colorido'}
                {formData.template === 'brutalist' && 'Brutalist - Ousado'}
                {formData.template === 'soft' && 'Soft - Suave'}
                {hasFixedColor() && (
                  <span 
                    className={styles.fixedColorBadge}
                    style={{ backgroundColor: getEffectiveColor() }}
                  >
                    Cor Fixa
                  </span>
                )}
              </span>
              <span className={styles.templateChange}>Alterar →</span>
            </button>
          </div>

          {!hasFixedColor() && (
            <div className={styles.inputGroup}>
              <label>Cor primária</label>
              <div className={styles.colorPicker}>
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value.trim() })}
                  placeholder="#667eea"
                />
              </div>
            </div>
          )}

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.collect_name}
                onChange={(e) => setFormData({ ...formData, collect_name: e.target.checked })}
              />
              Coletar nome
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.collect_phone}
                onChange={(e) => setFormData({ ...formData, collect_phone: e.target.checked })}
              />
              Coletar telefone
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.collect_suggestions}
                onChange={(e) => setFormData({ ...formData, collect_suggestions: e.target.checked })}
              />
              Coletar sugestões
            </label>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className={styles.generateBtn}
          >
            {loading ? '🤖 Gerando...' : variations.length > 0 ? '🔄 Gerar outra versão' : '✨ Gerar com IA'}
          </button>

          {variations.length > 0 && (
            <button
              onClick={handleSave}
              disabled={!formData.slug}
              className={styles.saveBtn}
            >
              💾 Salvar Landing Page
            </button>
          )}
          {/* Thumbnails */}
          {variations.length > 0 && (
            <div className={styles.thumbnailSection}>
              <label>Variações geradas ({variations.length})</label>
              <div className={styles.thumbnails}>
                {variations.map((variation, idx) => (
                  <div
                    key={idx}
                    className={`${styles.thumbnail} ${idx === selectedIndex ? styles.selected : ''}`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    <div className={styles.thumbnailNumber}>#{idx + 1}</div>
                    <div className={styles.thumbnailContent}>
                      <strong>{variation.headline}</strong>
                      <p>{variation.subheadline?.substring(0, 60)}...</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}        </div>

        {/* Preview */}
        <div className={styles.preview} ref={previewRef}>
          {variations.length > 0 ? (
            <LandingPagePreview
              headline={variations[selectedIndex].headline}
              subheadline={variations[selectedIndex].subheadline}
              ctaText={variations[selectedIndex].cta_text}
              valueProposition={variations[selectedIndex].value_proposition}
              howItWorks={variations[selectedIndex].how_it_works}
              faqItems={variations[selectedIndex].faq_items}
              ctaHeadline={variations[selectedIndex].cta_headline}
              ctaSubheadline={variations[selectedIndex].cta_subheadline}
              heroImage={variations[selectedIndex].hero_image}
              primaryColor={getEffectiveColor()}
              template={formData.template}
              collectName={formData.collect_name}
              collectPhone={formData.collect_phone}
            />
          ) : loading ? (
            <div className={styles.emptyPreview}>
              <div className={styles.loadingSpinner}>⏳</div>
              <p>Gerando sua landing page...</p>
            </div>
          ) : loading ? (
            <div className={styles.emptyPreview}>
              <div className={styles.loadingSpinner}>⏳</div>
              <p>Gerando sua landing page...</p>
            </div>
          ) : (
            <div className={styles.emptyPreview}>
              <p>👈 Preencha os campos e clique em "Gerar com IA"</p>
            </div>
          )}
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelector
          currentTemplate={formData.template}
          onTemplateChange={(template) => setFormData({ ...formData, template })}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
}
