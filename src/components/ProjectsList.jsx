import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './ProjectsList.module.css';

export default function ProjectsList({ projects, onProjectDeleted }) {
  const { token } = useAuth();
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (projectId, projectName) => {
    if (!confirm(`Tem certeza que deseja excluir "${projectName}"?`)) {
      return;
    }

    setDeleting(projectId);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        onProjectDeleted();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setDeleting(null);
    }
  };

  if (projects.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Nenhum projeto adicionado</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {projects.map(project => (
        <div key={project.id} className={styles.item}>
          <div className={styles.info}>
            <h3 className={styles.name}>{project.name}</h3>
            {project.url && (
              <a 
                href={project.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.url}
              >
                {project.url}
              </a>
            )}
            <div className={styles.meta}>
              <span className={styles.status} data-status={project.status}>
                {project.status === 'active' ? '🟢 Ativo' : '⚪ Pausado'}
              </span>
            </div>
          </div>
          
          <button
            className={styles.delete}
            onClick={() => handleDelete(project.id, project.name)}
            disabled={deleting === project.id}
            title="Excluir projeto"
          >
            {deleting === project.id ? '...' : '🗑️'}
          </button>
        </div>
      ))}
    </div>
  );
}
