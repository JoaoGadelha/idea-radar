import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Verify.module.css';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setError('Token não encontrado na URL');
      return;
    }

    verifyToken(token);
  }, [searchParams]);

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`/api/auth/verify?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        // Aguarda 1s para mostrar sucesso antes de redirecionar
        setTimeout(() => {
          login(data.token, data.user);
        }, 1000);
      } else {
        setStatus('error');
        setError(data.error || 'Token inválido ou expirado');
      }
    } catch (err) {
      setStatus('error');
      setError('Erro ao verificar token');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === 'loading' && (
          <>
            <div className={styles.spinner}></div>
            <h1 className={styles.title}>Verificando...</h1>
            <p className={styles.description}>Aguarde um momento</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.icon}>✅</div>
            <h1 className={styles.title}>Autenticado!</h1>
            <p className={styles.description}>Redirecionando para o dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.icon}>❌</div>
            <h1 className={styles.title}>Erro na verificação</h1>
            <p className={styles.error}>{error}</p>
            <a href="/login" className={styles.link}>
              Voltar para login
            </a>
          </>
        )}
      </div>
    </div>
  );
}
