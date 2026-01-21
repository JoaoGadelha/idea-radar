import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('joaoricardotg@gmail.com');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSent(true);
      } else {
        setError(data.message || 'Erro ao enviar link');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>📧</div>
          <h1 className={styles.title}>Email enviado!</h1>
          <p className={styles.description}>
            Enviamos um link de acesso para <strong>{email}</strong>
          </p>
          <p className={styles.hint}>
            Verifique sua caixa de entrada e clique no link para entrar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>📡</div>
        <h1 className={styles.title}>IdeaRadar</h1>
        <p className={styles.description}>
          Validação de ideias com IA
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
            autoFocus
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className={styles.button}
          >
            {loading ? 'Enviando...' : 'Entrar com Email'}
          </button>

          {error && <p className={styles.error}>{error}</p>}
        </form>

        <p className={styles.footer}>
          Sem senha. Sem cadastro. Apenas um link mágico no seu email.
        </p>
      </div>
    </div>
  );
}
