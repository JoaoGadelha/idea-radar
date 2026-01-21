/**
 * Auth Middleware - IdeaRadar
 * 
 * Valida JWT token e injeta userId no request
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

/**
 * Autentica um request via Bearer token
 * @param {Request} req - Request object
 * @returns {Object} { authenticated: boolean, userId?: string, error?: string }
 */
export async function authenticateRequest(req) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET);

    // Verifica se é um token de sessão (não magic-link)
    if (decoded.type === 'magic-link') {
      return { authenticated: false, error: 'Invalid token type' };
    }

    return {
      authenticated: true,
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { authenticated: false, error: 'Token expired' };
    }
    return { authenticated: false, error: 'Invalid token' };
  }
}

/**
 * Middleware wrapper para rotas protegidas
 */
export function withAuth(handler) {
  return async (req, res) => {
    const authResult = await authenticateRequest(req);

    if (!authResult.authenticated) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: authResult.error,
      });
    }

    // Injeta user info no request
    req.user = {
      userId: authResult.userId,
      email: authResult.email,
    };

    return handler(req, res);
  };
}
