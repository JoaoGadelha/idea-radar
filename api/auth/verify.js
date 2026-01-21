/**
 * API: Verify Magic Link
 * GET /api/auth/verify?token=xxx
 * 
 * Verifica o token do magic link e retorna um session token
 */

import jwt from 'jsonwebtoken';
import { getUserById, verifyUserEmail } from '../../src/services/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const SESSION_EXPIRY = '7d';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Verificar e decodificar o magic link token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Deve ser um token de magic-link
    if (decoded.type !== 'magic-link') {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    // Buscar usuário
    const user = await getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Marcar email como verificado
    if (!user.email_verified) {
      await verifyUserEmail(user.id);
    }

    // Gerar session token (mais duradouro)
    const sessionToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'session',
      },
      JWT_SECRET,
      { expiresIn: SESSION_EXPIRY }
    );

    console.log(`[Auth] User verified: ${user.email}`);

    return res.status(200).json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Link expired. Request a new one.' });
    }

    console.error('[Auth] Verify error:', error);
    return res.status(400).json({ error: 'Invalid token' });
  }
}
