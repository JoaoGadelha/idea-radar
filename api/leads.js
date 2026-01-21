/**
 * API: Webhook para captura de leads das landing pages
 * POST /api/leads
 * Body: { projectId: string, email: string, nome?: string, telefone?: string, sugestao?: string, source?: string }
 * 
 * Este endpoint é chamado pelas landing pages para registrar leads
 * Não requer autenticação (é público)
 */

import { saveLead, getProjectById } from '../src/services/database.js';

export default async function handler(req, res) {
  // Permitir CORS para as landing pages chamarem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId, email, nome, telefone, sugestao, source } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    // Verificar se o projeto existe
    const project = await getProjectById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Salvar lead
    const lead = await saveLead(
      projectId, 
      email.toLowerCase().trim(), 
      source || null,
      nome?.trim() || null,
      telefone?.trim() || null,
      sugestao?.trim() || null
    );

    console.log(`[Leads] New lead for project ${projectId}: ${nome || email}`);

    return res.status(201).json({
      success: true,
      message: 'Lead captured successfully',
      lead: {
        id: lead.id,
        email: lead.email
      }
    });
  } catch (error) {
    console.error('[Leads] Error:', error);

    // Erro de email duplicado
    if (error.code === '23505') {
      return res.status(200).json({
        success: true,
        message: 'Email already registered',
      });
    }

    return res.status(500).json({ error: 'Failed to save lead' });
  }
}
