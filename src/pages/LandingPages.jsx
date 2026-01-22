import { useState, useEffect } from 'react';
import styles from './LandingPages.module.css';
import LandingPageBuilder from '../components/LandingPageBuilder';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPages() {
  const { token } = useAuth();
  const [landingPages, setLandingPages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchLandingPages();
      fetchProjects();
    }
  }, [token]);

  const fetchLandingPages = async () => {
    try {
      const res = await fetch('/api/landing-pages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { landingPages } = await res.json();
      setLandingPages(landingPages || []);
    } catch (error) {
      console.error('Erro ao buscar landing pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { projects } = await res.json();
      setProjects(projects || []);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    }
  };

  const handleCreate = (projectId) => {
    setSelectedProjectId(projectId);
    setShowBuilder(true);
  };

  const handleSave = (landingPage) => {
    setLandingPages([landingPage, ...landingPages]);
    setShowBuilder(false);
    setSelectedProjectId(null);
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
        projectId={selectedProjectId}
        onClose={() => {
          setShowBuilder(false);
          setSelectedProjectId(null);
        }}
        onSave={handleSave}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Landing Pages</h1>
        {projects.length > 0 && (
          <div className={styles.projectSelector}>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
              className={styles.select}
            >
              <option value="">Escolha um projeto</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button 
              className={styles.createButton}
              onClick={() => handleCreate(selectedProjectId)}
              disabled={!selectedProjectId}
            >
              + Nova Landing Page
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : landingPages.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🚀</div>
          <h2>Nenhuma landing page criada</h2>
          <p>Crie landing pages para validar suas ideias e coletar leads</p>
          {projects.length === 0 ? (
            <p className={styles.hint}>Primeiro, crie um projeto na aba "Análise de Projetos"</p>
          ) : (
            <>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value || null)}
                className={styles.emptySelect}
              >
                <option value="">Escolha um projeto</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button 
                className={styles.emptyButton}
                onClick={() => handleCreate(selectedProjectId)}
                disabled={!selectedProjectId}
              >
                + Criar Primeira Landing Page
              </button>
            </>
          )}
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
