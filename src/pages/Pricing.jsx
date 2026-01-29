import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Pricing.module.css';

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    price: { BRL: 29, USD: 9 },
    credits: { landingPages: 15, analysis: 50 },
    description: 'Ideal para validar suas primeiras ideias',
    features: [
      '15 Landing Pages',
      '50 Análises com IA',
      'Créditos não expiram',
      'Suporte por email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    price: { BRL: 79, USD: 29 },
    credits: { landingPages: 50, analysis: 200 },
    description: 'Para validações intensivas',
    popular: true,
    features: [
      '50 Landing Pages',
      '200 Análises com IA',
      'Créditos não expiram',
      'Analytics avançado',
      'Suporte prioritário',
    ],
  },
  {
    id: 'agency',
    name: 'Agency Pack',
    price: { BRL: 199, USD: 79 },
    credits: { landingPages: 200, analysis: 1000 },
    description: 'Para agências e power users',
    features: [
      '200 Landing Pages',
      '1000 Análises com IA',
      'Créditos não expiram',
      'Analytics avançado',
      'Suporte prioritário',
      'Múltiplos projetos',
    ],
  },
];

export default function Pricing() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(null); // ID do pacote em loading
  const [error, setError] = useState(null);
  const [credits, setCredits] = useState(null);
  const [currency, setCurrency] = useState('BRL');

  // Verificar se voltou de um pagamento
  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    if (token) {
      fetchCredits();
    }
    // Detectar moeda baseado no locale
    const locale = navigator.language || 'pt-BR';
    setCurrency(locale.includes('BR') ? 'BRL' : 'USD');
  }, [token]);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/usage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
    }
  };

  const handlePurchase = async (packageId) => {
    if (!token) {
      navigate('/login?redirect=/pricing');
      return;
    }

    setLoading(packageId);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar checkout');
      }

      // Redirecionar para o Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoading(null);
    }
  };

  const formatPrice = (price) => {
    if (currency === 'BRL') {
      return `R$ ${price.BRL}`;
    }
    return `$${price.USD}`;
  };

  return (
    <div className={styles.container}>
      {/* Header simples */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <a href="/" className={styles.logo}>
            <span className={styles.logoIcon}>📡</span>
            <span>IdeaRadar</span>
          </a>
          {token ? (
            <button 
              className={styles.dashboardBtn}
              onClick={() => navigate('/')}
            >
              ← Voltar ao Dashboard
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
        {/* Mensagem de sucesso/erro do pagamento */}
        {paymentStatus === 'success' && (
          <div className={styles.successBanner}>
            🎉 Pagamento realizado com sucesso! Seus créditos já foram adicionados.
          </div>
        )}
        {paymentStatus === 'cancelled' && (
          <div className={styles.cancelBanner}>
            Pagamento cancelado. Você pode tentar novamente quando quiser.
          </div>
        )}

        {/* Créditos atuais (se logado) */}
        {credits && (
          <div className={styles.currentCredits}>
            <h3>Seus créditos atuais</h3>
            <div className={styles.creditsGrid}>
              <div className={styles.creditBox}>
                <span className={styles.creditIcon}>🚀</span>
                <span className={styles.creditValue}>{credits.lpRemaining}</span>
                <span className={styles.creditLabel}>Landing Pages</span>
              </div>
              <div className={styles.creditBox}>
                <span className={styles.creditIcon}>🤖</span>
                <span className={styles.creditValue}>{credits.analysisRemaining}</span>
                <span className={styles.creditLabel}>Análises IA</span>
              </div>
            </div>
          </div>
        )}

        {/* Título */}
        <div className={styles.titleSection}>
          <h1>Compre créditos</h1>
          <p>Pacotes de créditos que nunca expiram. Use quando precisar.</p>
          
          {/* Toggle de moeda */}
          <div className={styles.currencyToggle}>
            <button 
              className={`${styles.currencyBtn} ${currency === 'BRL' ? styles.active : ''}`}
              onClick={() => setCurrency('BRL')}
            >
              🇧🇷 BRL
            </button>
            <button 
              className={`${styles.currencyBtn} ${currency === 'USD' ? styles.active : ''}`}
              onClick={() => setCurrency('USD')}
            >
              🇺🇸 USD
            </button>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className={styles.error}>
            ❌ {error}
          </div>
        )}

        {/* Cards de preço */}
        <div className={styles.pricingGrid}>
          {PACKAGES.map((pkg) => (
            <div 
              key={pkg.id} 
              className={`${styles.pricingCard} ${pkg.popular ? styles.popular : ''}`}
            >
              {pkg.popular && (
                <div className={styles.popularBadge}>Mais Popular</div>
              )}
              
              <h2 className={styles.packageName}>{pkg.name}</h2>
              <p className={styles.packageDesc}>{pkg.description}</p>
              
              <div className={styles.price}>
                <span className={styles.priceValue}>{formatPrice(pkg.price)}</span>
                <span className={styles.priceLabel}>pagamento único</span>
              </div>

              <div className={styles.credits}>
                <div className={styles.creditItem}>
                  <span>🚀</span>
                  <span>{pkg.credits.landingPages} Landing Pages</span>
                </div>
                <div className={styles.creditItem}>
                  <span>🤖</span>
                  <span>{pkg.credits.analysis} Análises IA</span>
                </div>
              </div>

              <ul className={styles.features}>
                {pkg.features.map((feature, i) => (
                  <li key={i}>
                    <span className={styles.checkmark}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`${styles.buyBtn} ${pkg.popular ? styles.buyBtnPopular : ''}`}
                onClick={() => handlePurchase(pkg.id)}
                disabled={loading === pkg.id}
              >
                {loading === pkg.id ? (
                  <span className={styles.spinner}>⏳</span>
                ) : (
                  `Comprar ${pkg.name}`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ / Info */}
        <div className={styles.faq}>
          <h3>Dúvidas frequentes</h3>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h4>Os créditos expiram?</h4>
              <p>Não! Seus créditos nunca expiram. Use quando precisar, no seu ritmo.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>Posso comprar mais de um pacote?</h4>
              <p>Sim! Os créditos são cumulativos. Compre quantos pacotes precisar.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>Como funciona o pagamento?</h4>
              <p>Pagamento único via cartão de crédito, processado pelo Stripe (seguro).</p>
            </div>
            <div className={styles.faqItem}>
              <h4>Posso pedir reembolso?</h4>
              <p>Sim, dentro de 7 dias se não utilizou os créditos. Entre em contato.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2025 IdeaRadar. Valide suas ideias antes de construir.</p>
      </footer>
    </div>
  );
}
