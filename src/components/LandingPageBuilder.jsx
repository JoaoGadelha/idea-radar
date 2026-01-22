import { useState } from 'react';
import styles from './LandingPageBuilder.module.css';
import LandingPagePreview from './LandingPagePreview';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPageBuilder({ projectId, onClose, onSave }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [formData, setFormData] = useState({
    title: 'RoomGenius',
    slug: 'roomgenius',
    brief: 'Ferramenta de IA que transforma fotos de ambientes com novas decorações. Usuário envia foto do ambiente e escolhe estilo de decoração (minimalista, escandinavo, industrial). IA gera imagem mostrando como ficaria decorado. Público: pessoas que querem reformar e buscam inspiração.',
    primary_color: '#10b981',
    collect_name: true,
    collect_phone: false,
    collect_suggestions: true,
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Buscar dados do projeto
      const projectRes = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { project } = await projectRes.json();

      // Gerar variações
      const res = await fetch('/api/landing-pages/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectData: project,
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
      const res = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          slug: formData.slug,
          title: formData.title || selectedVariation.headline,
          headline: selectedVariation.headline,
          subheadline: selectedVariation.subheadline,
          description: selectedVariation.description,
          cta_text: selectedVariation.cta_text,
          primary_color: formData.primary_color,
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
        <h2>Nova Landing Page</h2>
        <button onClick={onClose} className={styles.closeBtn}>✕</button>
      </div>

      <div className={styles.content}>
        {/* Input Section */}
        <div className={styles.inputs}>
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
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                placeholder="#667eea"
              />
            </div>
          </div>

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
        <div className={styles.preview}>
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
              primaryColor={formData.primary_color}
              collectName={formData.collect_name}
              collectPhone={formData.collect_phone}
            />
          ) : (
            <div className={styles.emptyPreview}>
              <p>👈 Preencha os campos e clique em "Gerar com IA"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
