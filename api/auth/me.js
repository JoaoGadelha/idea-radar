/**
 * API: Get Current User
 * GET /api/auth/me
 */

import { authenticateRequest } from '../middleware/auth.js';
import { getUserById } from '../../src/services/database.js';

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
    const user = await getUserById(authResult.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('[Auth] Error fetching user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
