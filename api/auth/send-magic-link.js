/**
 * API: Send Magic Link
 * POST /api/auth/send-magic-link
 * Body: { email: string }
 */

import { Resend } from 'resend';
import jwt from 'jsonwebtoken';
import { getUserByEmail, createUser } from '../../src/services/database.js';
import { magicLinkTemplate } from '../templates/emailTemplates.js';
import { checkMaintenance } from '../middleware/maintenance.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const TOKEN_EXPIRY = '15m';
const DISABLE_RESEND = process.env.DISABLE_RESEND === 'true';

export default async function handler(req, res) {
  // Bloquear se em modo de manutenção
  const maintenance = checkMaintenance(req, res);
  if (maintenance.blocked) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Buscar ou criar usuário
    let user = await getUserByEmail(normalizedEmail);

    if (!user) {
      user = await createUser(normalizedEmail);
      console.log(`[Auth] New user created: ${normalizedEmail}`);
    }

    // Gerar JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'magic-link',
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // Construir magic link
    const forwardedProto = req.headers['x-forwarded-proto'];
    const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
    const requestBaseUrl = forwardedHost
      ? `${forwardedProto || 'http'}://${forwardedHost}`
      : null;

    let baseUrl =
      process.env.NODE_ENV !== 'production' && requestBaseUrl
        ? requestBaseUrl
        : process.env.APP_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
          'http://localhost:5173';

    baseUrl = baseUrl.replace(/\/+$/, '');
    const magicLink = `${baseUrl}/verify?token=${token}`;

    // Template do email
    const { html, text } = magicLinkTemplate(magicLink, normalizedEmail);

    // Enviar email
    if (DISABLE_RESEND) {
      console.log(`[Auth] Resend disabled. Magic link: ${magicLink}`);
      return res.status(200).json({
        success: true,
        message: 'Magic link generated (email disabled)',
        debug: process.env.NODE_ENV !== 'production' ? { magicLink } : undefined,
      });
    }

    await resend.emails.send({
      from: 'IdeaRadar <onboarding@resend.dev>',
      to: normalizedEmail,
      subject: '🔑 Seu link de acesso - IdeaRadar',
      html,
      text,
      headers: {
        'X-Entity-Ref-ID': '123456789'
      },
      tags: [
        {
          name: 'category',
          value: 'magic_link'
        }
      ]
    });

    console.log(`[Auth] Magic link sent to: ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      message: 'Magic link sent to your email',
    });
  } catch (error) {
    console.error('[Auth] Error sending magic link:', error);
    return res.status(500).json({
      error: 'Failed to send magic link',
      message: error.message,
    });
  }
}
