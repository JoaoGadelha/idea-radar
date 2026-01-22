import { useState } from 'react';
import styles from './LandingPageBuilder.module.css';
import LandingPagePreview from './LandingPagePreview';

export default function LandingPageBuilder({ projectId, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    brief: '',
    primary_color: '#667eea',
    collect_name: true,
    collect_phone: false,
    collect_suggestions: true,
  });

  const currentVariation = variations[selectedIndex];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
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
      setVariations(data.variations);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Erro ao gerar:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentVariation) return;

    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          slug: formData.slug,
          title: formData.title || currentVariation.headline,
          headline: currentVariation.headline,
          subheadline: currentVariation.subheadline,
          description: currentVariation.description,
          cta_text: currentVariation.cta_text,
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
        {/* Thumbnails Sidebar */}
        <div className={styles.thumbnails}>
          {variations.map((variation, index) => (
            <button
              key={variation.id}
              className={`${styles.thumbnail} ${index === selectedIndex ? styles.active : ''}`}
              onClick={() => setSelectedIndex(index)}
              title={variation.headline}
            >
              <div className={styles.thumbnailNumber}>v{index + 1}</div>
              <div className={styles.thumbnailPreview}>
                <div className={styles.miniHeadline}>{variation.headline.slice(0, 20)}...</div>
              </div>
            </button>
          ))}
        </div>

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
            <label>Brief adicional (opcional)</label>
            <textarea
              value={formData.brief}
              onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
              placeholder="Ex: Foque em profissionais de TI, tom descontraído..."
              rows={3}
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
            {loading ? '🤖 Gerando...' : variations.length > 0 ? '🔄 Gerar novamente' : '✨ Gerar com IA'}
          </button>

          {variations.length > 0 && (
            <button
              onClick={handleSave}
              disabled={!formData.slug}
              className={styles.saveBtn}
            >
              💾 Salvar versão v{selectedIndex + 1}
            </button>
          )}
        </div>

        {/* Preview */}
        <div className={styles.preview}>
          {currentVariation ? (
            <LandingPagePreview
              headline={currentVariation.headline}
              subheadline={currentVariation.subheadline}
              description={currentVariation.description}
              ctaText={currentVariation.cta_text}
              primaryColor={formData.primary_color}
              collectName={formData.collect_name}
              collectPhone={formData.collect_phone}
              collectSuggestions={formData.collect_suggestions}
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
