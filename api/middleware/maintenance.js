/**
 * Maintenance Mode Middleware - IdeaRadar
 * 
 * Bloqueia acesso às APIs quando em modo de validação/manutenção.
 * Permite apenas endpoints essenciais para a landing page.
 * Retorna 404 para esconder existência dos endpoints.
 */

// Endpoints permitidos durante o modo de manutenção
const ALLOWED_ENDPOINTS = [
  '/api/validation-leads',  // Coleta de leads da LP de validação
  // NOTA: /api/leads está BLOQUEADO durante manutenção
];

// Prefixos permitidos (para rotas dinâmicas)
const ALLOWED_PREFIXES = [
  // '/api/l/',  // Landing pages públicas - BLOQUEADO durante validação
];

// Chave secreta para bypass (para devs/admins)
const MAINTENANCE_BYPASS_KEY = process.env.MAINTENANCE_BYPASS_KEY || null;

/**
 * Verifica se o modo de manutenção está ativo
 */
export function isMaintenanceMode() {
  return process.env.MAINTENANCE_MODE === 'true';
}

/**
 * Verifica se uma rota está na lista de permitidas
 */
function isAllowedRoute(pathname) {
  // Verifica endpoints exatos
  if (ALLOWED_ENDPOINTS.includes(pathname)) {
    return true;
  }
  
  // Verifica prefixos
  for (const prefix of ALLOWED_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Verifica se o request tem bypass key válida
 */
function hasBypassKey(req) {
  if (!MAINTENANCE_BYPASS_KEY) return false;
  
  const bypassHeader = req.headers['x-maintenance-bypass'];
  const bypassQuery = new URL(req.url, 'http://localhost').searchParams.get('bypass');
  
  return bypassHeader === MAINTENANCE_BYPASS_KEY || bypassQuery === MAINTENANCE_BYPASS_KEY;
}

/**
 * Middleware de manutenção
 * Retorna 503 Service Unavailable para APIs não permitidas
 */
export function withMaintenanceCheck(handler) {
  return async (req, res) => {
    // Se não está em modo de manutenção, continua normalmente
    if (!isMaintenanceMode()) {
      return handler(req, res);
    }
    
    // Extrai pathname da URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    // Verifica bypass key
    if (hasBypassKey(req)) {
      console.log(`[Maintenance] Bypass autorizado para: ${pathname}`);
      return handler(req, res);
    }
    
    // Verifica se a rota está permitida
    if (isAllowedRoute(pathname)) {
      return handler(req, res);
    }
    
    // Bloqueia acesso - retorna 404 para esconder existência do endpoint
    console.log(`[Maintenance] Acesso bloqueado: ${pathname}`);
    return res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found.',
    });
  };
}

/**
 * Helper para verificar manutenção em qualquer handler
 */
export function checkMaintenance(req, res) {
  if (!isMaintenanceMode()) {
    return { blocked: false };
  }
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  if (hasBypassKey(req) || isAllowedRoute(pathname)) {
    return { blocked: false };
  }
  
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found.',
  });
  
  return { blocked: true };
}
