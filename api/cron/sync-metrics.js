/**
 * API: Sync Metrics (Cron + Manual)
 * GET /api/cron/sync-metrics?secret=xxx (automático - cron)
 * POST /api/cron/sync-metrics (manual - requer auth)
 * 
 * Coleta métricas do Google Analytics 4 para todos os projetos ativos
 */

import { authenticateRequest } from '../middleware/auth.js';
import { query } from '../../src/services/database.js';
import { fetchGA4Metrics } from '../../src/services/ga4.js';

const CRON_SECRET = process.env.CRON_SECRET || 'change-me-in-production';

/**
 * Coleta métricas REAIS do GA4
 * Retorna erro se não conseguir - sem fallback para dados simulados
 */
async function syncMetricsForProject(project) {
  // Validar que o projeto tem GA Property ID
  if (!project.ga_property_id) {
    throw new Error(`Projeto "${project.name}" não possui GA Property ID configurado`);
  }

  const propertyId = project.ga_property_id.replace('properties/', '');
  
  // Buscar dados reais do GA4
  const ga4Data = await fetchGA4Metrics(propertyId, 1);
  
  if (!ga4Data) {
    throw new Error(`Nenhum dado disponível no GA4 para "${project.name}". Verifique se há tráfego recente.`);
  }

  console.log(`[Sync] ✅ Dados REAIS do GA4 coletados para ${project.name}`);
  
  const { date, sessions, users, bounceRate, avgSessionDuration, ctaClicks, conversions, conversionRate } = ga4Data;

  // Salvar no banco
  await query(`
    INSERT INTO metrics (
      project_id, date, sessions, users, bounce_rate,
      avg_session_duration, cta_clicks, conversions, conversion_rate
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (project_id, date)
    DO UPDATE SET
      sessions = EXCLUDED.sessions,
      users = EXCLUDED.users,
      bounce_rate = EXCLUDED.bounce_rate,
      avg_session_duration = EXCLUDED.avg_session_duration,
      cta_clicks = EXCLUDED.cta_clicks,
      conversions = EXCLUDED.conversions,
      conversion_rate = EXCLUDED.conversion_rate
    RETURNING *
  `, [
    project.id,
    date,
    sessions,
    users,
    parseFloat(bounceRate),
    avgSessionDuration,
    ctaClicks,
    conversions,
    parseFloat(conversionRate)
  ]);

  return {
    projectId: project.id,
    projectName: project.name,
    date,
    sessions,
    conversions,
    conversionRate
  };
}

export default async function handler(req, res) {
  let isAuthorized = false;
  let userId = null;

  // Permitir cron automático (GET com secret)
  if (req.method === 'GET') {
    const { secret } = req.query;
    
    if (secret !== CRON_SECRET) {
      return res.status(401).json({ error: 'Invalid secret' });
    }
    
    isAuthorized = true;
    console.log('[Cron] Automated sync triggered');
  }

  // Permitir chamada manual autenticada (POST)
  if (req.method === 'POST') {
    const authResult = await authenticateRequest(req);
    
    if (!authResult.authenticated) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: authResult.error,
      });
    }
    
    isAuthorized = true;
    userId = authResult.userId;
    console.log(`[Sync] Manual sync triggered by user ${userId}`);
  }

  if (!isAuthorized) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

/**
 * Gera métricas simuladas (fallback)
 */
function generateMockMetrics() {
  const date = new Date().toISOString().split('T')[0];
  const sessions = Math.floor(Math.random() * 500) + 50;
  const users = Math.floor(sessions * 0.85);
  const bounceRate = (Math.random() * 50 + 20).toFixed(2);
  const avgSessionDuration = Math.floor(Math.random() * 120 + 30);
  const ctaClicks = Math.floor(sessions * 0.15);
  const conversions = Math.floor(ctaClicks * 0.25);
  const conversionRate = ((conversions / sessions) * 100).toFixed(2);

  return {
    date,
    sessions,
    users,
    bounceRate,
    avgSessionDuration,
    ctaClicks,
    conversions,
    conversionRate,
  };
}
    // Buscar projetos ativos (filtrar por userId se for chamada manual)
    let projectsQuery = `
      SELECT id, name, url, ga_property_id
      FROM projects
      WHERE status = 'active'
    `;
    
    if (userId) {
      projectsQuery += ` AND user_id = $1`;
    }

    const result = userId
      ? await query(projectsQuery, [userId])
      : await query(projectsQuery);
    
    const projects = result.rows;

    if (projects.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active projects to sync',
        synced: 0
      });
    }

    // Sincronizar cada projeto
    const results = [];
    for (const project of projects) {
      try {
        const metrics = await syncMetricsForProject(project);
        results.push(metrics);
      } catch (error) {
        console.error(`[Sync] Error syncing project ${project.id}:`, error);
        results.push({
          projectId: project.id,
          projectName: project.name,
          error: error.message
        });
      }
    }

    console.log(`[Sync] Completed: ${results.length} projects`);

    return res.status(200).json({
      success: true,
      message: `Synced ${results.length} project(s)`,
      synced: results.length,
      results
    });
  } catch (error) {
    console.error('[Sync] Fatal error:', error);
    return res.status(500).json({
      error: 'Sync failed',
      message: error.message
    });
  }
}
