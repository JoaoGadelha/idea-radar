/**
 * GET /api/usage
 * Retorna informações de uso do plano do usuário
 */

import { authenticateRequest } from '../middleware/auth.js';
import { getUserUsage } from '../services/planLimiter.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authResult = await authenticateRequest(req);

  if (!authResult.authenticated) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: authResult.error,
    });
  }

  try {
    const usage = await getUserUsage(authResult.userId);
    
    return res.status(200).json(usage);
  } catch (error) {
    console.error('Erro ao buscar usage:', error);
    return res.status(500).json({
      error: 'Erro ao buscar informações de uso',
    });
  }
}
