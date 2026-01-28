/**
 * IdeaRadar Lead Utils
 * 
 * Utilitários para enriquecer dados de leads:
 * - Captura de UTM params
 * - Classificação de qualidade do email
 * - Detecção de device/referrer
 */

/**
 * Captura UTM params da URL atual
 * @returns {Object} UTM params encontrados
 */
export function getUTMParams() {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  
  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
    utm_term: params.get('utm_term') || null,
    utm_content: params.get('utm_content') || null,
  };
}

/**
 * Classifica a qualidade de um email
 * @param {string} email 
 * @returns {Object} Classificação do email
 */
export function classifyEmail(email) {
  if (!email) return { type: 'unknown', quality: 0 };
  
  const loweredEmail = email.toLowerCase().trim();
  const domain = loweredEmail.split('@')[1];
  
  // Domínios de email pessoal/gratuito (baixa qualidade para B2B)
  const personalDomains = [
    'gmail.com', 'googlemail.com',
    'hotmail.com', 'hotmail.com.br', 'outlook.com', 'outlook.com.br', 'live.com', 'msn.com',
    'yahoo.com', 'yahoo.com.br', 'ymail.com',
    'icloud.com', 'me.com', 'mac.com',
    'protonmail.com', 'proton.me',
    'aol.com',
    'uol.com.br', 'bol.com.br', 'terra.com.br', 'ig.com.br', 'globo.com', 'globomail.com',
    'mail.com', 'zoho.com',
  ];
  
  // Domínios temporários/descartáveis (baixíssima qualidade)
  const disposableDomains = [
    'tempmail.com', 'guerrillamail.com', 'mailinator.com', '10minutemail.com',
    'throwaway.email', 'fakeinbox.com', 'trashmail.com', 'temp-mail.org',
    'yopmail.com', 'maildrop.cc', 'getairmail.com',
  ];
  
  // Verificar se é descartável
  if (disposableDomains.some(d => domain.includes(d))) {
    return {
      type: 'disposable',
      quality: 1,
      domain,
      warning: 'Email temporário/descartável'
    };
  }
  
  // Verificar se é pessoal
  if (personalDomains.includes(domain)) {
    return {
      type: 'personal',
      quality: 5,
      domain,
      description: 'Email pessoal'
    };
  }
  
  // Domínios educacionais
  if (domain.endsWith('.edu') || domain.endsWith('.edu.br') || domain.includes('university') || domain.includes('college')) {
    return {
      type: 'educational',
      quality: 6,
      domain,
      description: 'Email educacional'
    };
  }
  
  // Se não é nenhum dos acima, provavelmente é corporativo
  return {
    type: 'corporate',
    quality: 10,
    domain,
    description: 'Email corporativo',
    company: domain.split('.')[0] // Nome provável da empresa
  };
}

/**
 * Detecta informações do dispositivo do usuário
 * @returns {Object} Informações do device
 */
export function getDeviceInfo() {
  if (typeof window === 'undefined') return { device: 'unknown' };
  
  const ua = navigator.userAgent.toLowerCase();
  
  let device = 'desktop';
  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    device = 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    device = 'tablet';
  }
  
  let browser = 'other';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'safari';
  else if (ua.includes('firefox')) browser = 'firefox';
  else if (ua.includes('edg')) browser = 'edge';
  
  return {
    device,
    browser,
    language: navigator.language || 'unknown',
    screenWidth: window.screen?.width || 0,
    screenHeight: window.screen?.height || 0,
  };
}

/**
 * Captura o referrer (de onde veio o visitante)
 * @returns {string|null} Referrer URL ou null
 */
export function getReferrer() {
  if (typeof document === 'undefined') return null;
  return document.referrer || null;
}

/**
 * Monta objeto completo de metadados do lead
 * @param {string} landingPageId 
 * @param {string} email 
 * @returns {Object} Metadados enriquecidos
 */
export function buildLeadMetadata(landingPageId, email) {
  const utmParams = getUTMParams();
  const emailClassification = classifyEmail(email);
  const deviceInfo = getDeviceInfo();
  const referrer = getReferrer();
  
  // Construir source string enriquecida
  let source = `lp-${landingPageId || 'unknown'}`;
  if (utmParams.utm_source) {
    source += `|src:${utmParams.utm_source}`;
  }
  if (utmParams.utm_medium) {
    source += `|med:${utmParams.utm_medium}`;
  }
  if (utmParams.utm_campaign) {
    source += `|camp:${utmParams.utm_campaign}`;
  }
  
  return {
    source,
    metadata: {
      utm: utmParams,
      email: emailClassification,
      device: deviceInfo,
      referrer,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      pageUrl: typeof window !== 'undefined' ? window.location.href : null,
    }
  };
}
