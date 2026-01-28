/**
 * API: Leads de validação do próprio IdeaRadar
 * POST /api/validation-leads
 * 
 * Endpoint separado para capturar leads da LP de validação
 * Não requer projeto existente no banco
 * 
 * Proteções:
 * - Rate limiting por IP (5 requests por minuto)
 * - Validação de email
 * - Honeypot field
 */

import { sql } from '@vercel/postgres';

// Rate limiting em memória (para Vercel serverless, considerar usar Redis/KV em produção)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX = 5; // 5 requests por minuto por IP

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress ||
         'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return false;
  }
  
  // Reset se passou a janela
  if (now - record.firstRequest > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return false;
  }
  
  // Incrementa e verifica
  record.count++;
  return record.count > RATE_LIMIT_MAX;
}

// Limpar rate limit map periodicamente (evitar memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.firstRequest > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

// Validação de email mais rigorosa
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  // Bloquear domínios descartáveis conhecidos
  const disposableDomains = ['tempmail.com', 'throwaway.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) return false;
  return true;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIP = getClientIP(req);
  if (isRateLimited(clientIP)) {
    console.log(`[Validation Lead] Rate limited: ${clientIP}`);
    return res.status(429).json({ 
      error: 'Too many requests',
      message: 'Por favor, aguarde um momento antes de tentar novamente.',
      retryAfter: 60
    });
  }

  const { email, nome, perfil, ideia, sugestao, source, metadata, website } = req.body;

  // Honeypot - se o campo "website" estiver preenchido, é bot
  if (website) {
    console.log(`[Validation Lead] Honeypot triggered: ${clientIP}`);
    // Retorna sucesso fake para não alertar o bot
    return res.status(201).json({ success: true, message: 'Lead captured successfully' });
  }

  // Validação de email
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    // Verificar/criar tabela de validation_leads se não existir
    await sql`
      CREATE TABLE IF NOT EXISTS validation_leads (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        nome VARCHAR(255),
        perfil VARCHAR(100),
        ideia TEXT,
        sugestao TEXT,
        source VARCHAR(100),
        metadata JSONB,
        ip_hash VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email)
      )
    `;

    // Hash do IP para analytics sem armazenar IP real
    const ipHash = clientIP !== 'unknown' 
      ? Buffer.from(clientIP + process.env.JWT_SECRET).toString('base64').substring(0, 16)
      : null;

    // Inserir lead
    const result = await sql`
      INSERT INTO validation_leads (email, nome, perfil, ideia, sugestao, source, metadata, ip_hash)
      VALUES (
        ${email.toLowerCase().trim()}, 
        ${nome || null},
        ${perfil || null},
        ${ideia || null},
        ${sugestao || null}, 
        ${source || 'validacao-lp'},
        ${JSON.stringify(metadata || {})},
        ${ipHash}
      )
      ON CONFLICT (email) 
      DO UPDATE SET 
        nome = COALESCE(EXCLUDED.nome, validation_leads.nome),
        perfil = COALESCE(EXCLUDED.perfil, validation_leads.perfil),
        ideia = COALESCE(EXCLUDED.ideia, validation_leads.ideia),
        sugestao = COALESCE(EXCLUDED.sugestao, validation_leads.sugestao),
        metadata = validation_leads.metadata || EXCLUDED.metadata,
        source = COALESCE(EXCLUDED.source, validation_leads.source)
      RETURNING id, email
    `;

    console.log(`[Validation Lead] ${email} | perfil: ${perfil || 'N/A'} | ideia: ${ideia ? 'sim' : 'não'}`);

    return res.status(201).json({
      success: true,
      message: 'Lead captured successfully',
      lead: result.rows[0]
    });

  } catch (error) {
    console.error('[Validation Leads] Error:', error);
    return res.status(500).json({ error: 'Failed to save lead' });
  }
}
