import styles from './LandingPagePreview.module.css';

export default function LandingPagePreview({
  headline,
  subheadline,
  description,
  ctaText,
  primaryColor = '#667eea',
  logoUrl,
  heroImageUrl,
  collectName = true,
  collectPhone = false,
  collectSuggestions = true,
}) {
  return (
    <div className={styles.preview}>
      {/* Hero Section */}
      <section 
        className={styles.hero}
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%)` 
        }}
      >
        <div className={styles.heroContent}>
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className={styles.logo} />
          )}
          
          <h1 className={styles.headline}>{headline}</h1>
          
          {subheadline && (
            <p className={styles.subheadline}>{subheadline}</p>
          )}
        </div>

        {heroImageUrl && (
          <div className={styles.heroImage}>
            <img src={heroImageUrl} alt="Hero" />
          </div>
        )}
      </section>

      {/* Description Section */}
      <section className={styles.description}>
        <div className={styles.container}>
          <div className={styles.descriptionContent}>
            {description.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className={styles.formSection}>
        <div className={styles.container}>
          <div className={styles.formCard}>
            <h2>Manifeste seu interesse</h2>
            <form className={styles.form}>
              <div className={styles.formGroup}>
                <label>Email *</label>
                <input 
                  type="email" 
                  placeholder="seu@email.com" 
                  required 
                  disabled
                />
              </div>

              {collectName && (
                <div className={styles.formGroup}>
                  <label>Nome</label>
                  <input 
                    type="text" 
                    placeholder="Seu nome" 
                    disabled
                  />
                </div>
              )}

              {collectPhone && (
                <div className={styles.formGroup}>
                  <label>Telefone</label>
                  <input 
                    type="tel" 
                    placeholder="(00) 00000-0000" 
                    disabled
                  />
                </div>
              )}

              {collectSuggestions && (
                <div className={styles.formGroup}>
                  <label>Sugestões ou comentários</label>
                  <textarea 
                    placeholder="O que você gostaria de ver neste produto?" 
                    rows={3}
                    disabled
                  />
                </div>
              )}

              <button 
                type="submit" 
                className={styles.ctaButton}
                style={{ background: primaryColor }}
                disabled
              >
                {ctaText}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>© 2026 - Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
}

// Helper para escurecer cor
function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
