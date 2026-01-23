import { useState } from 'react';
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
  heroImageType = 'none',
  template = 'claude',
  collectPhone = false,
  collectSuggestions = false,
  isInteractive = false,
  projectId = null, // ID do projeto para salvar leads
  landingPageId = null, // ID da landing page
}) {
  const [formData, setFormData] = useState({ email: '', phone: '', suggestions: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isInteractive) return;

    setLoading(true);
    try {
      // Modo simulação (preview sem projectId)
      if (!projectId) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setSubmitted(true);
        setFormData({ email: '', phone: '', suggestions: '' });
        setLoading(false);
        return;
      }

      // Modo real (com projectId)
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          email: formData.email,
          telefone: collectPhone ? formData.phone : null,
          sugestoes: collectSuggestions ? formData.suggestions : null,
          source: `landing-page-${landingPageId || 'unknown'}`,
        }),
      });

      if (!res.ok) throw new Error('Erro ao enviar');

      setSubmitted(true);
      setFormData({ email: '', phone: '', suggestions: '' });
    } catch (error) {
      console.error('Erro ao enviar lead:', error);
      alert('Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
        <div className={`${styles.heroContainer} ${heroImageType === 'none' ? styles.heroContainerCentered : ''}`}>
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
              <button 
                type="button"
                className={styles.heroCta}
                style={{ backgroundColor: primaryColor }}
                onClick={() => {
                  const ctaSection = document.querySelector('[data-cta-final]');
                  if (ctaSection) {
                    ctaSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
              >
                {ctaText || 'Quero testar'}
              </button>
              <p className={styles.ctaHint}>✉️ Sem spam. Avisamos quando lançar.</p>
            </div>
          </div>

          {/* Hero Image */}
          {heroImageType !== 'none' && (
            <div className={styles.heroVisual}>
              {heroImage ? (
                <img 
                  src={heroImage} 
                  alt="Hero" 
                  className={styles.heroImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={styles.heroPlaceholder}
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}40 100%)`,
                  display: heroImage ? 'none' : 'flex'
                }}
              >
                <span style={{ fontSize: '3rem' }}>🖼️</span>
                <p style={{ margin: '1rem 0 0', opacity: 0.7, textAlign: 'center', padding: '0 1rem' }}>
                  {heroImageType === 'url' ? 'Insira uma URL válida para sua imagem' : 'Imagem hero'}
                </p>
              </div>
            </div>
          )}
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
        data-cta-final
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

          {submitted ? (
            <div className={styles.successMessage} style={{ color: 'white', fontSize: '1.25rem', textAlign: 'center', padding: '2rem' }}>
              ✅ Obrigado! Você está na lista. Avisaremos em breve!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.ctaFinalForm}>
              <input 
                type="email" 
                placeholder="seu@email.com" 
                className={styles.ctaFinalInput}
                disabled={loading}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              {collectPhone && (
                <input 
                  type="tel" 
                  placeholder="(00) 00000-0000" 
                  className={styles.ctaFinalInput}
                  disabled={loading}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required={collectPhone}
                />
              )}
              {collectSuggestions && (
                <textarea 
                  placeholder="Tem alguma sugestão ou feedback?" 
                  className={styles.ctaFinalInput}
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  disabled={loading}
                  value={formData.suggestions}
                  onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                  rows={3}
                />
              )}
              <button 
                type="submit"
                className={styles.ctaFinalButton}
                disabled={loading}
              >
                {loading ? 'Enviando...' : (ctaText || 'Garantir meu acesso')} →
              </button>
            </form>
          )}

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
