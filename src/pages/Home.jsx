import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const { token } = useAuth();

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <a href="/" className={styles.logo}>
            <span className={styles.logoIcon}>📡</span>
            <span>IdeaRadar</span>
          </a>
          {token ? (
            <button 
              className={styles.dashboardBtn}
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </button>
          ) : (
            <button 
              className={styles.loginBtn}
              onClick={() => navigate('/login')}
            >
              Entrar
            </button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.headline}>
              Pare de perder 3–6 meses construindo produtos que ninguém usa
            </h1>
            <p className={styles.subheadline}>
              Valide sua ideia de negócio em dias com landing pages, métricas reais e análise por IA.
            </p>
            <button 
              className={styles.ctaButton}
              onClick={() => navigate(token ? '/dashboard' : '/login')}
            >
              Começar agora — é grátis
            </button>
            <p className={styles.ctaHint}>
              ✓ 3 landing pages grátis • ✓ 10 análises IA • ✓ Sem cartão de crédito
            </p>
          </div>
        </section>

        {/* Problema e Solução */}
        <section className={styles.problemSolution}>
          <div className={styles.cardsGrid}>
            <div className={styles.problemBox}>
              <h2><span className={styles.icon}>😩</span> O problema</h2>
              <ul className={styles.problemList}>
                <li>3–6 meses desenvolvendo um MVP que ninguém usa</li>
                <li>Decisões baseadas em achismo ou feedback enviesado</li>
                <li>Pesquisas de mercado caras, lentas e inconclusivas</li>
                <li>Lançar e perceber tarde demais que não há demanda</li>
              </ul>
            </div>

            <div className={styles.solutionBox}>
              <h2><span className={styles.icon}>✨</span> A solução</h2>
              <ul className={styles.solutionList}>
                <li>Landing page de validação pronta em minutos</li>
                <li>Métricas reais: visitas, cliques e conversões</li>
                <li>IA analisa os dados e aponta sinais de demanda</li>
                <li>Decida rápido se vale continuar ou matar a ideia</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className={styles.socialProof}>
          <p className={styles.socialProofText}>
            "Economizei 4 meses. Descobri em 1 semana que ninguém queria meu SaaS de agendamento. Pivotei para outra ideia que validou em 3 dias."
          </p>
          <p className={styles.socialProofAuthor}>— Fundador de startup validada</p>
        </section>

        {/* CTA Final */}
        <section className={styles.finalCta}>
          <h2>Pronto para validar sua ideia?</h2>
          <p>Comece grátis. Sem cartão. Sem risco.</p>
          <button 
            className={styles.ctaButton}
            onClick={() => navigate(token ? '/dashboard' : '/login')}
          >
            Criar minha primeira landing page
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 IdeaRadar. Valide suas ideias antes de construir.</p>
      </footer>
    </div>
  );
}
