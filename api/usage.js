/**
 * API: Uso e Créditos do Usuário
 * GET /api/usage
 * 
 * Retorna informações de créditos e features do usuário
 */

import { authenticateRequest } from './middleware/auth.js';
import { checkMaintenance } from './middleware/maintenance.js';
import { getUserUsage, getAvailablePackages } from './services/planLimiter.js';

export default async function handler(req, res) {
  // Bloquear se em modo de manutenção
  const maintenance = checkMaintenance(req, res);
  if (maintenance.blocked) return;

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

  const userId = authResult.userId;

  try {
    const usage = await getUserUsage(userId);
    const packages = getAvailablePackages();

    return res.status(200).json({
      ...usage,
      availablePackages: packages,
    });
  } catch (error) {
    console.error('[Usage] Error:', error);
    return res.status(500).json({ error: 'Failed to get usage info' });
  }
}
