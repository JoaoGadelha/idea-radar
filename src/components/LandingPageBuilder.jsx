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
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [improveData, setImproveData] = useState({
    benefits: '',
    howItWorks: '',
    faq: '',
  });
  const previewRef = useRef(null);
  const inputsRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    brief: '',
    primary_color: '#10b981',
    template: 'claude', // Template padrão
    collect_phone: false,
    collect_suggestions: true,
    hero_image_type: 'none', // 'none', 'url', 'upload', 'ai'
    hero_image_url: '',
  });

  // Retorna a cor efetiva (fixa ou customizável)
  const getEffectiveColor = () => {
    return TEMPLATES_WITH_FIXED_COLOR[formData.template] || formData.primary_color;
  };

  // Scroll to top on mount - múltiplos timers para garantir
  useEffect(() => {
    console.log('[Scroll Debug] Component mounted');
    
    const scrollToTop = () => {
      console.log('[Scroll Debug] Tentando scroll to top', {
        previewScrollTop: previewRef.current?.scrollTop,
        inputsScrollTop: inputsRef.current?.scrollTop,
        windowScrollY: window.scrollY
      });
      
      if (previewRef.current) previewRef.current.scrollTop = 0;
      if (inputsRef.current) inputsRef.current.scrollTop = 0;
      window.scrollTo(0, 0);
      
      console.log('[Scroll Debug] Após scroll', {
        previewScrollTop: previewRef.current?.scrollTop,
        inputsScrollTop: inputsRef.current?.scrollTop,
        windowScrollY: window.scrollY
      });
    };
    
    // Executar várias vezes para garantir após renders
    scrollToTop();
    const t1 = setTimeout(scrollToTop, 0);
    const t2 = setTimeout(scrollToTop, 50);
    const t3 = setTimeout(scrollToTop, 150);
    const t4 = setTimeout(scrollToTop, 300);
    const t5 = setTimeout(scrollToTop, 500);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
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

  // Incorporar dados do modal ao brief
  const handleIncorporateImproveData = () => {
    let additionalInfo = '';

    if (improveData.benefits.trim()) {
      additionalInfo += `\n\n[beneficios]\n${improveData.benefits.trim()}`;
    }

    if (improveData.howItWorks.trim()) {
      additionalInfo += `\n\n[como-funciona]\n${improveData.howItWorks.trim()}`;
    }

    if (improveData.faq.trim()) {
      additionalInfo += `\n\n[perguntas-frequentes]\n${improveData.faq.trim()}`;
    }

    if (additionalInfo) {
      setFormData({
        ...formData,
        brief: formData.brief + additionalInfo
      });
    }

    // Limpar dados do modal e fechar
    setImproveData({ benefits: '', howItWorks: '', faq: '' });
    setShowImproveModal(false);
  };

  // DEV: Preencher com exemplo do SkillSwap
  const handleDevPopulate = () => {
    setFormData({
      ...formData,
      title: 'SkillSwap',
      slug: 'skillswap',
      brief: 'O projeto consiste no desenvolvimento de um aplicativo chamado SkillSwap, voltado para a troca de habilidades entre pessoas interessadas em aprender e ensinar diferentes conhecimentos sem a utilização de dinheiro. A plataforma permite que usuários criem perfis informando quais habilidades dominam e quais desejam aprender, possibilitando a conexão entre indivíduos com interesses complementares. Por meio de um sistema de busca e matching, os usuários podem encontrar parceiros para troca de conhecimento, comunicar-se via chat, agendar sessões e avaliar as experiências após cada interação. O aplicativo utiliza um sistema de créditos baseado no tempo dedicado ao ensino, incentivando a colaboração contínua e a construção de uma comunidade de aprendizagem colaborativa, segura e escalável.',
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

      console.log('📤 [Generate] Enviando dados:', {
        title: formData.title,
        briefPreview: formData.brief.substring(0, 100) + '...'
      });

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

      // Verificar campos faltando
      const variation = data.variation;
      const missing = [];
      if (!variation.value_proposition || variation.value_proposition.length === 0) {
        missing.push('Benefícios/Proposta de Valor');
      }
      if (!variation.how_it_works || variation.how_it_works.length === 0) {
        missing.push('Como Funciona');
      }
      if (!variation.faq_items || variation.faq_items.length === 0) {
        missing.push('Perguntas Frequentes (FAQ)');
      }

      setMissingFields(missing);
      if (missing.length > 0) {
        setShowImproveModal(true);
      }
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
          description: formData.brief, // Usar o brief como description
          cta_text: selectedVariation.cta_text,
          value_proposition: selectedVariation.value_proposition,
          how_it_works: selectedVariation.how_it_works,
          faq_items: selectedVariation.faq_items,
          cta_headline: selectedVariation.cta_headline,
          cta_subheadline: selectedVariation.cta_subheadline,
          primary_color: getEffectiveColor(),
          template: formData.template,
          collect_phone: formData.collect_phone,
          collect_suggestions: formData.collect_suggestions,
          hero_image: formData.hero_image_type === 'url' ? formData.hero_image_url : null,
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
            {missingFields.length > 0 && (
              <button
                type="button"
                onClick={() => setShowImproveModal(true)}
                className={styles.improveBtn}
              >
                💡 Melhorar descrição ({missingFields.length} {missingFields.length === 1 ? 'seção faltando' : 'seções faltando'})
              </button>
            )}
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

          <div className={styles.inputGroup}>
            <label>Imagem Hero</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="hero_image_type"
                  value="none"
                  checked={formData.hero_image_type === 'none'}
                  onChange={(e) => setFormData({ ...formData, hero_image_type: e.target.value, hero_image_url: '' })}
                />
                <span>Sem imagem (texto centralizado)</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="hero_image_type"
                  value="url"
                  checked={formData.hero_image_type === 'url'}
                  onChange={(e) => setFormData({ ...formData, hero_image_type: e.target.value })}
                />
                <span>URL externa</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="hero_image_type"
                  value="upload"
                  checked={formData.hero_image_type === 'upload'}
                  onChange={(e) => setFormData({ ...formData, hero_image_type: e.target.value })}
                  disabled
                />
                <span>Upload (em breve)</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="hero_image_type"
                  value="ai"
                  checked={formData.hero_image_type === 'ai'}
                  onChange={(e) => setFormData({ ...formData, hero_image_type: e.target.value })}
                  disabled
                />
                <span>Gerar com IA (em breve)</span>
              </label>
            </div>
            
            {formData.hero_image_type === 'url' && (
              <input
                type="url"
                value={formData.hero_image_url}
                onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
                className={styles.urlInput}
              />
            )}
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
              Coletar sugestões/feedback
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
              heroImage={formData.hero_image_type === 'url' ? formData.hero_image_url : variations[selectedIndex].hero_image}
              heroImageType={formData.hero_image_type}
              primaryColor={getEffectiveColor()}
              template={formData.template}
              collectPhone={formData.collect_phone}
              collectSuggestions={formData.collect_suggestions}
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

      {/* Improve Description Modal */}
      {showImproveModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImproveModal(false)}>
          <div className={styles.improveModal} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowImproveModal(false)} className={styles.closeBtn}>✕</button>
            
            <div className={styles.improveModalContent}>
              <h3>💡 Melhore sua landing page</h3>
              <p>A IA não conseguiu gerar algumas seções. Preencha abaixo para complementar sua descrição:</p>
              
              <ul className={styles.missingList}>
                {missingFields.map((field, idx) => (
                  <li key={idx}>
                    <span className={styles.missingIcon}>❌</span>
                    {field}
                  </li>
                ))}
              </ul>

              <div className={styles.improveFields}>
                {missingFields.includes('Benefícios/Proposta de Valor') && (
                  <div className={styles.improveField}>
                    <label>
                      <strong>📌 Benefícios/Proposta de Valor</strong>
                      <small>Liste os principais benefícios, um por linha</small>
                    </label>
                    <textarea
                      value={improveData.benefits}
                      onChange={(e) => setImproveData({ ...improveData, benefits: e.target.value })}
                      placeholder="Ex:&#10;- Economia de até 50% no tempo&#10;- Interface intuitiva e fácil de usar&#10;- Resultados em 24 horas"
                      rows={4}
                    />
                  </div>
                )}

                {missingFields.includes('Como Funciona') && (
                  <div className={styles.improveField}>
                    <label>
                      <strong>🔄 Como Funciona</strong>
                      <small>Descreva o passo a passo, pode numerar</small>
                    </label>
                    <textarea
                      value={improveData.howItWorks}
                      onChange={(e) => setImproveData({ ...improveData, howItWorks: e.target.value })}
                      placeholder="Ex:&#10;1. Faça seu cadastro em 2 minutos&#10;2. Configure suas preferências&#10;3. Comece a usar imediatamente"
                      rows={4}
                    />
                  </div>
                )}

                {missingFields.includes('Perguntas Frequentes (FAQ)') && (
                  <div className={styles.improveField}>
                    <label>
                      <strong>❓ Perguntas Frequentes</strong>
                      <small>Liste perguntas e respostas que seu público pode ter</small>
                    </label>
                    <textarea
                      value={improveData.faq}
                      onChange={(e) => setImproveData({ ...improveData, faq: e.target.value })}
                      placeholder="Ex:&#10;1. Quanto custa? R$ 49/mês&#10;2. Tem período de teste? Sim, 7 dias grátis&#10;3. Posso cancelar quando quiser? Sim, sem multa"
                      rows={5}
                    />
                  </div>
                )}
              </div>

              <div className={styles.improveModalActions}>
                <button 
                  className={styles.improveCloseBtn}
                  onClick={handleIncorporateImproveData}
                >
                  ✅ Adicionar e gerar novamente
                </button>
                <button 
                  className={styles.improveContinueBtn}
                  onClick={() => setShowImproveModal(false)}
                >
                  Continuar assim mesmo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
