import claudeStyles from './LandingPagePreview.module.css';
import stripeStyles from './LandingPagePreview.stripe.module.css';
import vercelStyles from './LandingPagePreview.vercel.module.css';
import gradientStyles from './LandingPagePreview.gradient.module.css';
import brutalistStyles from './LandingPagePreview.brutalist.module.css';
import softStyles from './LandingPagePreview.soft.module.css';

export default function LandingPagePreview({
  headline,
  subheadline,
  valueProposition = [],
  ctaText,
  howItWorks = [],
  faqItems = [],
  ctaHeadline,
  ctaSubheadline,
  primaryColor = '#6366f1',
  heroImage,
  template = 'claude',
  collectName = true,
  collectPhone = false,
  isInteractive = false, // Nova prop para habilitar formulário funcional
}) {
  // Seleciona o CSS baseado no template
  const styles = 
    template === 'stripe' ? stripeStyles :
    template === 'vercel' ? vercelStyles :
    template === 'gradient' ? gradientStyles :
    template === 'brutalist' ? brutalistStyles :
    template === 'soft' ? softStyles :
    claudeStyles;
  return (
    <div className={styles.preview}>
      {/* Navigation - Clean minimal nav */}
      <nav className={styles.nav}>
        <div className={styles.navContainer}>
          <div className={styles.logoText}>✨ Brand</div>
          <button 
            className={styles.navCta}
            style={{ backgroundColor: primaryColor }}
          >
            {ctaText || 'Começar'}
          </button>
        </div>
      </nav>

      {/* Hero Section - Split layout with image */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            {/* Badge de pré-lançamento */}
            <div 
              className={styles.badge}
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              🚀 Em breve
            </div>

            <h1 className={styles.headline}>{headline}</h1>
            
            {subheadline && (
              <p className={styles.subheadline}>{subheadline}</p>
            )}

            {/* Value Props como checklist */}
            {valueProposition.length > 0 && (
              <ul className={styles.valueList}>
                {valueProposition.map((benefit, idx) => (
                  <li key={idx}>
                    <span 
                      className={styles.checkIcon}
                      style={{ color: primaryColor }}
                    >
                      ✓
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            )}

            {/* CTA Group */}
            <div className={styles.ctaGroup}>
              <div className={styles.emailInputGroup}>
                <input 
                  type="email" 
                  placeholder="seu@email.com" 
                  className={styles.heroEmailInput}
                  disabled={!isInteractive}
                />
                <button 
                  className={styles.heroCta}
                  style={{ backgroundColor: primaryColor }}
                  disabled={!isInteractive}
                >
                  {ctaText || 'Quero testar'}
                </button>
              </div>
              <p className={styles.ctaHint}>✉️ Sem spam. Avisamos quando lançar.</p>
            </div>
          </div>

          {/* Hero Image */}
          <div className={styles.heroVisual}>
            {heroImage ? (
              <img 
                src={heroImage} 
                alt="Hero" 
                className={styles.heroImage}
              />
            ) : (
              <div 
                className={styles.heroPlaceholder}
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}40 100%)` 
                }}
              >
                <span>🖼️</span>
                <p>Imagem gerada por IA</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className={styles.socialProof}>
        <div className={styles.socialProofContainer}>
          <div className={styles.proofItem}>
            <span className={styles.proofNumber}>500+</span>
            <span className={styles.proofLabel}>Na lista de espera</span>
          </div>
          <div className={styles.proofDivider}></div>
          <div className={styles.proofItem}>
            <span className={styles.proofNumber}>4.9★</span>
            <span className={styles.proofLabel}>Avaliação beta testers</span>
          </div>
          <div className={styles.proofDivider}></div>
          <div className={styles.proofItem}>
            <span className={styles.proofNumber}>30s</span>
            <span className={styles.proofLabel}>Tempo médio</span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      {howItWorks.length > 0 && (
        <section className={styles.howItWorks}>
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeader}>
              <span 
                className={styles.sectionTag}
                style={{ color: primaryColor }}
              >
                COMO FUNCIONA
              </span>
              <h2 className={styles.sectionTitle}>
                Simples como <span style={{ color: primaryColor }}>1, 2, 3</span>
              </h2>
            </div>

            <div className={styles.stepsGrid}>
              {howItWorks.map((step, idx) => (
                <div key={idx} className={styles.stepCard}>
                  <div 
                    className={styles.stepIcon}
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <span>{step.icon || ['📸', '✨', '🎉'][idx]}</span>
                  </div>
                  <div className={styles.stepContent}>
                    <div 
                      className={styles.stepNumber}
                      style={{ color: primaryColor }}
                    >
                      Passo {idx + 1}
                    </div>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepDescription}>{step.description}</p>
                  </div>
                  {idx < howItWorks.length - 1 && (
                    <div className={styles.stepConnector}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faqItems.length > 0 && (
        <section className={styles.faq}>
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeader}>
              <span 
                className={styles.sectionTag}
                style={{ color: primaryColor }}
              >
                DÚVIDAS?
              </span>
              <h2 className={styles.sectionTitle}>Perguntas frequentes</h2>
            </div>

            <div className={styles.faqGrid}>
              {faqItems.map((item, idx) => (
                <div key={idx} className={styles.faqCard}>
                  <div className={styles.faqQuestion}>
                    <span 
                      className={styles.faqIcon}
                      style={{ color: primaryColor }}
                    >
                      ?
                    </span>
                    <h3>{item.question}</h3>
                  </div>
                  <p className={styles.faqAnswer}>{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section 
        className={styles.ctaFinal}
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -30)} 100%)` 
        }}
      >
        <div className={styles.ctaFinalContainer}>
          <div className={styles.ctaFinalContent}>
            <h2 className={styles.ctaFinalHeadline}>
              {ctaHeadline || 'Pronto para começar?'}
            </h2>
            <p className={styles.ctaFinalSubheadline}>
              {ctaSubheadline || 'Junte-se aos primeiros a experimentar.'}
            </p>
          </div>

          <div className={styles.ctaFinalForm}>
            {collectName && (
              <input 
                type="text" 
                placeholder="Seu nome" 
                className={styles.ctaFinalInput}
                disabled={!isInteractive}
              />
            )}
            <input 
              type="email" 
              placeholder="seu@email.com" 
              className={styles.ctaFinalInput}
              disabled={!isInteractive}
            />
            {collectPhone && (
              <input 
                type="tel" 
                placeholder="(00) 00000-0000" 
                className={styles.ctaFinalInput}
                disabled={!isInteractive}
              />
            )}
            <button 
              className={styles.ctaFinalButton}
              disabled={!isInteractive}
            >
              {ctaText || 'Garantir meu acesso'} →
            </button>
          </div>

          <p className={styles.ctaFinalDisclaimer}>
            🔒 Seus dados estão seguros. Sem spam, só novidades.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerBrand}>✨ Brand</div>
          <p className={styles.footerCopy}>
            © 2026 - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}

// Helper para ajustar cor
function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
