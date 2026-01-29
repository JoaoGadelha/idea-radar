import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import ProjectsList from '../components/ProjectsList';
import ChatInterface from '../components/ChatInterface';
import AddProjectModal from '../components/AddProjectModal';
import SyncMetricsButton from '../components/SyncMetricsButton';
import LandingPages from './LandingPages';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' or 'landing-pages'
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    fetchProjects();
    fetchCredits();
  }, [refreshTrigger]);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/usage', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleProjectAdded = () => {
    setShowAddModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProjectDeleted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleMetricsSynced = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleResetCredits = async () => {
    if (!confirm('⚠️ DEV: Zerar todos os créditos?')) return;
    
    try {
      const response = await fetch('/api/dev/reset-credits', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('✅ Créditos zerados!');
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert('❌ Erro ao zerar créditos');
      }
    } catch (error) {
      console.error('Error resetting credits:', error);
      alert('❌ Erro ao zerar créditos');
    }
  };

  return (
    <div className={styles.container}>
      <Header onAddProject={() => setShowAddModal(true)} />
      
      {/* Card de Créditos */}
      {credits !== null && (
        <div className={styles.creditsCard}>
          <div className={styles.creditsInfo}>
            <div className={styles.creditItem}>
              <span className={styles.creditIcon}>🚀</span>
              <div>
                <span className={styles.creditValue}>{credits.lpRemaining}</span>
                <span className={styles.creditLabel}>Landing Pages</span>
              </div>
            </div>
            <div className={styles.creditItem}>
              <span className={styles.creditIcon}>🤖</span>
              <div>
                <span className={styles.creditValue}>{credits.analysisRemaining}</span>
                <span className={styles.creditLabel}>Análises IA</span>
              </div>
            </div>
          </div>
          <button className={styles.buyCreditsBtn} onClick={() => navigate('/pricing')}>
            + Comprar créditos
          </button>
          {process.env.NODE_ENV !== 'production' && (
            <button className={styles.devResetBtn} onClick={handleResetCredits}>
              🔴 DEV: Zerar créditos
            </button>
          )}
        </div>
      )}
      
      {/* Tabs de navegação */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'analysis' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          📊 Análise de Projetos
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'landing-pages' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('landing-pages')}
        >
          🚀 Landing Pages
        </button>
      </div>
      
      <div className={styles.content}>
        {activeTab === 'analysis' ? (
          <>
            {/* Sidebar com projetos */}
            <aside className={styles.sidebar}>
              <div className={styles.sidebarHeader}>
                <h2>Seus Projetos</h2>
                <button 
                  className={styles.addButton}
                  onClick={() => setShowAddModal(true)}
                >
                  + Novo
                </button>
              </div>

              {loadingProjects ? (
                <div className={styles.loading}>Carregando...</div>
              ) : (
                <ProjectsList 
                  projects={projects}
                  onProjectDeleted={handleProjectDeleted}
                />
              )}
            </aside>

            {/* Área principal - Chat */}
            <main className={styles.main}>
              <SyncMetricsButton onSynced={handleMetricsSynced} />
          
          {projects.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📦</div>
              <h2>Nenhum projeto ainda</h2>
              <p>Adicione seu primeiro projeto para começar a analisar métricas com IA</p>
              <button 
                className={styles.emptyButton}
                onClick={() => setShowAddModal(true)}
              >
                + Adicionar Projeto
              </button>
            </div>
          ) : (
            <ChatInterface projectsCount={projects.length} />
          )}
            </main>
          </>
        ) : (
          /* Aba de Landing Pages */
          <LandingPages />
        )}
      </div>

      {showAddModal && (
        <AddProjectModal
          onClose={() => setShowAddModal(false)}
          onProjectAdded={handleProjectAdded}
        />
      )}
    </div>
  );
}
