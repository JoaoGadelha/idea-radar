import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import ProjectsList from '../components/ProjectsList';
import ChatInterface from '../components/ChatInterface';
import AddProjectModal from '../components/AddProjectModal';
import SyncMetricsButton from '../components/SyncMetricsButton';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchProjects();
  }, [refreshTrigger]);

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

  return (
    <div className={styles.container}>
      <Header onAddProject={() => setShowAddModal(true)} />
      
      <div className={styles.content}>
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
