import { useState, useEffect } from 'react';
import styles from './LandingPages.module.css';
import LandingPageBuilder from '../components/LandingPageBuilder';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPages() {
  const { token } = useAuth();
  const [landingPages, setLandingPages] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchLandingPages();
    }
  }, [token]);

  const fetchLandingPages = async () => {
    try {
      const res = await fetch('/api/landing-pages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('[LandingPages] Fetched:', data);
      setLandingPages(data.landingPages || []);
    } catch (error) {
      console.error('Erro ao buscar landing pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setShowBuilder(true);
  };

  const handleSave = (landingPage) => {
    setLandingPages([landingPage, ...landingPages]);
    setShowBuilder(false);
    // Recarregar para pegar dados atualizados do projeto
    fetchLandingPages();
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta landing page?')) return;

    try {
      await fetch(`/api/landing-pages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setLandingPages(landingPages.filter(lp => lp.id !== id));
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao deletar landing page');
    }
  };

  if (showBuilder) {
    return (
      <LandingPageBuilder
        onClose={() => {
          setShowBuilder(false);
        }}
        onSave={handleSave}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Landing Pages</h1>
        <button 
          className={styles.createButton}
          onClick={handleCreate}
        >
          + Nova Landing Page
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : landingPages.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🚀</div>
          <h2>Nenhuma landing page criada</h2>
          <p>Crie landing pages para validar suas ideias e coletar leads</p>
          <button 
            className={styles.emptyButton}
            onClick={handleCreate}
          >
            + Criar Primeira Landing Page
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {landingPages.map(lp => (
            <div key={lp.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>{lp.title}</h3>
                <span className={`${styles.status} ${styles[lp.status]}`}>
                  {lp.status === 'draft' ? '📝 Rascunho' : lp.status === 'published' ? '✅ Publicada' : '📦 Arquivada'}
                </span>
              </div>
              <p className={styles.headline}>{lp.headline}</p>
              {lp.project_name && (
                <div className={styles.project}>🎯 {lp.project_name}</div>
              )}
              <div className={styles.cardFooter}>
                <a 
                  href={`/l/${lp.slug}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  Ver página →
                </a>
                <button
                  onClick={() => handleDelete(lp.id)}
                  className={styles.deleteBtn}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
