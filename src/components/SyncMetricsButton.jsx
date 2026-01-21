import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './SyncMetricsButton.module.css';

export default function SyncMetricsButton({ onSynced }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/cron/sync-metrics', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Verificar se houve erros nos resultados individuais
        const hasErrors = data.results?.some(r => r.error);
        const errorMessages = data.results?.filter(r => r.error).map(r => `${r.projectName}: ${r.error}`);
        
        if (hasErrors) {
          setResult({
            success: false,
            message: `⚠️ Erros na coleta:\n${errorMessages.join('\n')}`
          });
        } else {
          setResult({
            success: true,
            message: `✅ ${data.synced} projeto(s) sincronizado(s)!`
          });
          onSynced?.();
          
          // Limpa mensagem após 5s
          setTimeout(() => setResult(null), 5000);
        }
      } else {
        setResult({
          success: false,
          message: `❌ ${data.message || data.error || 'Erro ao sincronizar'}`
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: '❌ Erro de conexão'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.warning}>
        <div className={styles.content}>
          <div>
            <strong>⚡ Coleta Manual de Métricas</strong>
            <p>Força a coleta de métricas reais do Google Analytics 4</p>
          </div>
          <button
            onClick={handleSync}
            disabled={loading}
            className={styles.button}
          >
            {loading ? 'Sincronizando...' : '🔄 Forçar Coleta'}
          </button>
        </div>
        {result && (
          <div 
            className={styles.result}
            data-success={result.success}
          >
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
