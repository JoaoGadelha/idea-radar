import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './AddProjectModal.module.css';

export default function AddProjectModal({ onClose, onProjectAdded }) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    gaPropertyId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onProjectAdded();
      } else {
        setError(data.error || 'Erro ao criar projeto');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Novo Projeto</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Nome do Projeto *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: RoomGenius"
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label>URL da Landing Page</label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://exemplo.com"
            />
            <span className={styles.hint}>Opcional</span>
          </div>

          <div className={styles.field}>
            <label>Google Analytics Property ID</label>
            <input
              type="text"
              name="gaPropertyId"
              value={formData.gaPropertyId}
              onChange={handleChange}
              placeholder="properties/123456789"
            />
            <span className={styles.hint}>Opcional - Encontre em Google Analytics → Admin</span>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button 
              type="button" 
              onClick={onClose}
              className={styles.cancel}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className={styles.submit}
            >
              {loading ? 'Criando...' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
