/**
 * DEV ONLY: Reset user credits to 0
 * POST /api/dev/reset-credits
 */

import { sql } from '@vercel/postgres';
import { authenticateRequest } from '../middleware/auth.js';

export default async function handler(req, res) {
  // Só funciona em modo de desenvolvimento
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEV_ENDPOINTS) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Autenticação obrigatória
  const authResult = await authenticateRequest(req);
  if (!authResult.authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = authResult.userId;

  try {
    // Zera todos os créditos
    await sql`
      UPDATE user_credits
      SET 
        lp_credits = 0,
        analysis_credits = 0,
        lp_credits_used = 0,
        analysis_credits_used = 0
      WHERE user_id = ${userId}
    `;

    console.log(`[DEV] Credits reset for user ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Créditos zerados',
    });
  } catch (error) {
    console.error('[DEV] Error resetting credits:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
