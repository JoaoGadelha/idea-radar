/**
 * IdeaRadar Analytics Service
 * 
 * Serviço centralizado para tracking de eventos via GA4.
 * Usado automaticamente nas landing pages criadas no builder.
 */

// Measurement ID do GA4 centralizado do IdeaRadar
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

/**
 * Inicializa o Google Analytics 4 na página
 * @param {Object} config - Configuração da landing page
 * @param {string} config.landingPageId - ID da landing page
 * @param {string} config.projectId - ID do projeto
 * @param {string} config.slug - Slug da landing page
 */
export function initGA4(config = {}) {
  // Evitar inicializar múltiplas vezes
  if (window.__ga4Initialized) {
    console.log('[Analytics] GA4 já inicializado');
    return;
  }

  // Não inicializar em ambiente de desenvolvimento local (opcional)
  // if (window.location.hostname === 'localhost') {
  //   console.log('[Analytics] Skipping GA4 em localhost');
  //   return;
  // }

  const { landingPageId, projectId, slug } = config;

  // Criar e injetar o script do gtag.js
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Inicializar dataLayer e gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  
  // Configurar com dimensões customizadas
  window.gtag('config', GA_MEASUREMENT_ID, {
    // Dimensões customizadas para segmentar por LP
    'custom_map': {
      'dimension1': 'landing_page_id',
      'dimension2': 'project_id',
      'dimension3': 'landing_page_slug'
    },
    'landing_page_id': landingPageId || 'unknown',
    'project_id': projectId || 'unknown',
    'landing_page_slug': slug || 'unknown',
    // Configurações adicionais
    'send_page_view': true,
    'cookie_flags': 'SameSite=None;Secure'
  });

  window.__ga4Initialized = true;
  window.__ga4Config = config;

  console.log('[Analytics] GA4 inicializado', { GA_MEASUREMENT_ID, ...config });
}

/**
 * Envia um evento para o GA4
 * @param {string} eventName - Nome do evento
 * @param {Object} params - Parâmetros do evento
 */
export function trackEvent(eventName, params = {}) {
  if (!window.gtag) {
    console.warn('[Analytics] gtag não disponível');
    return;
  }

  // Adicionar contexto da LP automaticamente
  const config = window.__ga4Config || {};
  const enrichedParams = {
    ...params,
    landing_page_id: config.landingPageId || 'unknown',
    project_id: config.projectId || 'unknown',
    landing_page_slug: config.slug || 'unknown',
  };

  window.gtag('event', eventName, enrichedParams);
  console.log('[Analytics] Event:', eventName, enrichedParams);
}

/**
 * Trackear clique no CTA
 * @param {string} ctaText - Texto do botão
 * @param {string} location - Localização do CTA (hero, nav, final)
 */
export function trackCTAClick(ctaText, location = 'unknown') {
  trackEvent('cta_click', {
    cta_text: ctaText,
    cta_location: location,
  });
}

/**
 * Trackear submissão do formulário (lead gerado)
 * @param {Object} data - Dados do lead
 * @param {string} data.hasPhone - Se incluiu telefone
 * @param {string} data.hasSuggestion - Se incluiu sugestão
 */
export function trackLeadGenerated(data = {}) {
  trackEvent('generate_lead', {
    method: 'email_form',
    has_phone: data.hasPhone || false,
    has_suggestion: data.hasSuggestion || false,
    value: 1, // Para contagem
  });

  // Também enviar como conversão
  trackEvent('conversion', {
    send_to: `${GA_MEASUREMENT_ID}/lead`,
  });
}

/**
 * Trackear scroll depth
 * @param {number} percentage - Percentual de scroll (25, 50, 75, 100)
 */
export function trackScrollDepth(percentage) {
  trackEvent('scroll', {
    percent_scrolled: percentage,
  });
}

/**
 * Inicializa o tracking de scroll depth
 * Dispara eventos em 25%, 50%, 75% e 100%
 */
export function initScrollTracking() {
  const thresholds = [25, 50, 75, 100];
  const triggered = new Set();

  const handleScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;

    const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);

    thresholds.forEach(threshold => {
      if (scrollPercent >= threshold && !triggered.has(threshold)) {
        triggered.add(threshold);
        trackScrollDepth(threshold);
      }
    });
  };

  // Throttle para performance
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Check inicial (caso já esteja scrollado)
  handleScroll();
}

/**
 * Trackear tempo na página
 * Dispara eventos em 10s, 30s, 60s, 120s
 */
export function initTimeOnPageTracking() {
  const milestones = [10, 30, 60, 120]; // segundos
  let startTime = Date.now();

  milestones.forEach(seconds => {
    setTimeout(() => {
      // Só trackear se a página ainda estiver visível
      if (document.visibilityState === 'visible') {
        trackEvent('time_on_page', {
          seconds: seconds,
          engagement_time_msec: seconds * 1000,
        });
      }
    }, seconds * 1000);
  });
}

/**
 * Trackear visualização de seção específica
 * @param {string} sectionName - Nome da seção (hero, features, pricing, etc)
 */
export function trackSectionView(sectionName) {
  trackEvent('section_view', {
    section_name: sectionName,
  });
}

/**
 * Setup completo de analytics para uma landing page
 * @param {Object} config - Configuração da landing page
 */
export function setupLandingPageAnalytics(config) {
  initGA4(config);
  initScrollTracking();
  initTimeOnPageTracking();
  
  console.log('[Analytics] Setup completo para LP:', config.slug);
}
