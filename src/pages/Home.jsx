import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const handleCTA = () => {
    navigate(token ? '/dashboard' : '/login');
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <a href="/" className={styles.logo}>
          <div className={styles.logoIcon}>📡</div>
          <span>IdeaRadar</span>
        </a>
        <nav className={styles.headerNav}>
          <a href="#features" className={styles.headerLink}>Recursos</a>
          <a href="#pricing" className={styles.headerLink}>Preços</a>
          <a href="#faq" className={styles.headerLink}>FAQ</a>
          <button className={styles.headerCta} onClick={handleCTA}>
            {token ? 'Dashboard' : 'Entrar'}
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <span className={styles.badge}>
          ✨ Comece grátis — 3 landing pages + 10 análises
        </span>
        <h1>
          Pare de perder 3–6 meses construindo <span className={styles.highlight}>produtos que ninguém usa</span>
        </h1>
        <p className={styles.subtitle}>
          Valide sua ideia de negócio em dias com landing pages, métricas reais e análise por IA.
        </p>
        <div className={styles.heroCta}>
          <button className={styles.btnPrimary} onClick={handleCTA}>
            Começar grátis →
          </button>
          <a href="#how-it-works" className={styles.btnSecondary}>
            Ver como funciona
          </a>
        </div>
      </section>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <div className={styles.statNumber}>42%</div>
          <div className={styles.statLabel}>das startups falham por<br/>falta de mercado</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNumber}>3-6 meses</div>
          <div className={styles.statLabel}>economizados em<br/>desenvolvimento</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNumber}>10 min</div>
          <div className={styles.statLabel}>para criar uma<br/>landing page</div>
        </div>
      </div>

      {/* Problema e Solução */}
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

        <div className={`${styles.problemBox} ${styles.solution}`}>
          <h2><span className={styles.icon}>✨</span> A solução</h2>
          <ul className={`${styles.problemList} ${styles.solutionList}`}>
            <li>Landing page de validação pronta em minutos</li>
            <li>Métricas reais: visitas, cliques e conversões</li>
            <li>IA analisa os dados e aponta sinais de demanda</li>
            <li>Decida rápido se vale continuar ou matar a ideia</li>
          </ul>
        </div>
      </div>

      {/* Como funciona */}
      <section className={styles.howItWorks} id="how-it-works">
        <div className={styles.sectionHeader}>
          <h2>Como funciona</h2>
          <p>Validação em 3 passos simples</p>
        </div>
        
        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepNumber}>1</span>
            <span className={styles.stepIcon}>💡</span>
            <h3>Descreva sua ideia</h3>
            <p>Conte para a IA o que você quer validar. Ela cria a landing page automaticamente com copy persuasivo.</p>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepIcon}>🚀</span>
            <h3>Colete métricas</h3>
            <p>Compartilhe o link e veja em tempo real quem visita, quanto tempo fica e quem se cadastra.</p>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepIcon}>🧠</span>
            <h3>Receba insights</h3>
            <p>Pergunte à IA sobre seus dados. Ela analisa tudo e te diz se a ideia tem potencial.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features} id="features">
        <div className={styles.sectionHeader}>
          <h2>Tudo que você precisa</h2>
          <p>Para validar ideias rapidamente</p>
        </div>
        
        <div className={styles.featureGrid}>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>📝</div>
            <h4>Landing Pages com IA</h4>
            <p>Descreva sua ideia e a IA cria uma landing page profissional com textos persuasivos.</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>📊</div>
            <h4>Métricas em Tempo Real</h4>
            <p>Integração com Google Analytics. Veja visitas, tempo na página e conversões.</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>🤖</div>
            <h4>Análise com IA</h4>
            <p>Pergunte qualquer coisa sobre seus dados. A IA responde com insights acionáveis.</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>🎯</div>
            <h4>Coleta de Leads</h4>
            <p>Formulário integrado para capturar emails de interessados na sua ideia.</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>🎨</div>
            <h4>7 Templates Visuais</h4>
            <p>Escolha entre estilos como Stripe, Vercel, Gradient, Minimal e mais.</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>⚡</div>
            <h4>Deploy Instantâneo</h4>
            <p>Sua landing page fica online em segundos com URL personalizada.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.pricing} id="pricing">
        <div className={styles.sectionHeader}>
          <h2>Preços simples</h2>
          <p>Compre créditos quando precisar. Sem mensalidade.</p>
        </div>
        
        <div className={styles.pricingGrid}>
          <div className={styles.pricingCard}>
            <h3>Free</h3>
            <div className={`${styles.price} ${styles.priceFree}`}>Grátis</div>
            <ul>
              <li>3 Landing Pages</li>
              <li>10 Análises com IA</li>
              <li>Métricas básicas</li>
              <li>1 Template</li>
            </ul>
            <button className={styles.btnSecondary} onClick={handleCTA}>Começar grátis</button>
          </div>
          
          <div className={`${styles.pricingCard} ${styles.popular}`}>
            <span className={styles.popularBadge}>Mais Popular</span>
            <h3>Pro Pack</h3>
            <div className={styles.price}>R$ 79 <span>único</span></div>
            <ul>
              <li>50 Landing Pages</li>
              <li>200 Análises com IA</li>
              <li>Analytics avançado</li>
              <li>Todos os templates</li>
              <li>Suporte prioritário</li>
            </ul>
            <button className={styles.btnPrimary} onClick={() => navigate('/pricing')}>Comprar créditos</button>
          </div>
          
          <div className={styles.pricingCard}>
            <h3>Agency</h3>
            <div className={styles.price}>R$ 199 <span>único</span></div>
            <ul>
              <li>200 Landing Pages</li>
              <li>1000 Análises com IA</li>
              <li>Analytics avançado</li>
              <li>Todos os templates</li>
              <li>Suporte prioritário</li>
            </ul>
            <button className={styles.btnSecondary} onClick={() => navigate('/pricing')}>Ver detalhes</button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faq} id="faq">
        <div className={styles.sectionHeader}>
          <h2>Perguntas Frequentes</h2>
        </div>
        
        <div className={styles.faqList}>
          <details className={styles.faqItem}>
            <summary className={styles.faqQuestion}>
              Preciso saber programar?
            </summary>
            <p className={styles.faqAnswer}>
              Não! O IdeaRadar foi feito para não-técnicos. Você só precisa descrever sua ideia e a IA faz o resto. Nenhuma linha de código necessária.
            </p>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqQuestion}>
              Quanto tempo leva para criar uma landing page?
            </summary>
            <p className={styles.faqAnswer}>
              Em média, 5–10 minutos. Você descreve a ideia, escolhe o template e a IA gera todo o conteúdo.
              Ao publicar, as métricas já começam a ser coletadas automaticamente — sem configuração extra.
            </p>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqQuestion}>
              Preciso configurar métricas ou Google Analytics?
            </summary>
            <p className={styles.faqAnswer}>
              Não. Toda landing criada pelo IdeaRadar já sai com métricas automáticas desde o primeiro acesso. Visitas, tempo na página e conversões são coletados automaticamente. A integração com Google Analytics é opcional.
            </p>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqQuestion}>
              Os créditos expiram?
            </summary>
            <p className={styles.faqAnswer}>
              Não! Seus créditos nunca expiram. Use quando quiser, no seu ritmo. Sem pressa, sem pressão.
            </p>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqQuestion}>
              Como funciona a análise com IA?
            </summary>
            <p className={styles.faqAnswer}>
              Você pode perguntar qualquer coisa sobre seus dados: "Qual landing page está convertendo mais?", "Devo pivotar essa ideia?", "O que os leads estão sugerindo?". A IA analisa suas métricas e responde.
            </p>
          </details>
        </div>
      </section>

      {/* CTA Final */}
      <section className={styles.ctaFinal}>
        <h2>Pronto para validar sua ideia?</h2>
        <p>Comece grátis. Sem cartão de crédito. 3 landing pages + 10 análises para testar.</p>
        <button className={styles.btnPrimary} onClick={handleCTA}>
          Criar conta grátis →
        </button>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>IdeaRadar © 2026 — Valide antes de construir</p>
        <p className={styles.footerLinks}>
          <a href="#">Termos de Uso</a> · <a href="#">Privacidade</a>
        </p>
      </footer>
    </div>
  );
}
