/**
 * API: Webhook para captura de leads das landing pages
 * POST /api/leads
 * Body: { projectId: string, email: string, nome?: string, telefone?: string, sugestao?: string, source?: string, metadata?: object }
 * 
 * Este endpoint é chamado pelas landing pages para registrar leads
 * Não requer autenticação (é público)
 */

import { saveLead, getProjectById, getUserById } from '../src/services/database.js';
import { checkMaintenance } from './middleware/maintenance.js';
import { sendLeadNotification } from './services/emailService.js';

export default async function handler(req, res) {
  // Bloquear se em modo de manutenção (retorna 404)
  const maintenance = checkMaintenance(req, res);
  if (maintenance.blocked) return;

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

  const { projectId, email, nome, telefone, sugestao, source, metadata } = req.body;

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

    // Salvar lead com metadados enriquecidos
    const lead = await saveLead(
      projectId, 
      email.toLowerCase().trim(), 
      source || null,
      nome?.trim() || null,
      telefone?.trim() || null,
      sugestao?.trim() || null,
      metadata || null
    );

    console.log(`[Leads] New lead for project ${projectId}: ${nome || email} | quality: ${metadata?.email?.type || 'unknown'}`);

    // 📧 Enviar notificação por email para o dono do projeto
    try {
      const owner = await getUserById(project.user_id);
      if (owner?.email) {
        // Não bloquear a resposta - enviar em background
        sendLeadNotification(
          { email: email.toLowerCase().trim(), nome, telefone, sugestao, metadata },
          project,
          owner.email
        ).catch(err => console.error('[Leads] Email notification failed:', err));
      }
    } catch (emailError) {
      console.error('[Leads] Error getting owner for notification:', emailError);
      // Não falhar por causa do email - lead já foi salvo
    }

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

    // Erro de limite atingido
    if (error.message && error.message.includes('Limite de 5 cadastros')) {
      return res.status(200).json({
        success: true,
        message: error.message,
      });
    }

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
