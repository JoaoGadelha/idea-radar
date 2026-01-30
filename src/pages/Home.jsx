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

        {/* How it works */}
        <section className={styles.howItWorks}>
          <h2>Como funciona</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepIcon}>🤖</div>
              <h3>1. IA cria sua landing page</h3>
              <p>Descreva sua ideia e a IA gera uma landing page de validação em 2 minutos</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepIcon}>📊</div>
              <h3>2. Colete dados reais</h3>
              <p>Compartilhe o link e veja quem se interessa. Métricas automáticas via GA4</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepIcon}>💡</div>
              <h3>3. Análise inteligente</h3>
              <p>IA analisa suas métricas e diz se sua ideia validou ou precisa de ajustes</p>
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

        {/* Features */}
        <section className={styles.features}>
          <h2>Por que validar antes de construir?</h2>
          <div className={styles.featureGrid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>⏱️</div>
              <h3>Economize meses de desenvolvimento</h3>
              <p>63% dos produtos falham por falta de demanda real. Descubra ANTES de codificar</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>💰</div>
              <h3>Evite gastar milhares à toa</h3>
              <p>R$29 para validar vs R$50.000+ para construir algo que ninguém quer</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🎯</div>
              <h3>Decisões baseadas em dados</h3>
              <p>Não confie em opiniões de amigos. Meça interesse real do mercado</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🚀</div>
              <h3>Valide múltiplas ideias rápido</h3>
              <p>Teste 5 ideias em 1 semana. Construa apenas a que validar</p>
            </div>
          </div>
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
