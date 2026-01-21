/**
 * API: Single Project Operations
 * GET /api/projects/[id] - Detalhes do projeto
 * PUT /api/projects/[id] - Atualiza projeto
 * DELETE /api/projects/[id] - Remove projeto
 */

import { authenticateRequest } from '../middleware/auth.js';
import {
  getProjectById,
  updateProject,
  deleteProject,
  getProjectMetrics,
} from '../../src/services/database.js';

export default async function handler(req, res) {
  const authResult = await authenticateRequest(req);

  if (!authResult.authenticated) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: authResult.error,
    });
  }

  const userId = authResult.userId;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  // Verificar se o projeto pertence ao usuário
  const project = await getProjectById(id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.user_id !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // GET - Detalhes do projeto + métricas
  if (req.method === 'GET') {
    try {
      const metrics = await getProjectMetrics(id, 30);

      return res.status(200).json({
        project,
        metrics,
      });
    } catch (error) {
      console.error('[Projects] Error fetching:', error);
      return res.status(500).json({ error: 'Failed to fetch project' });
    }
  }

  // PUT - Atualiza projeto
  if (req.method === 'PUT') {
    const { name, url, gaPropertyId, status } = req.body;

    try {
      const updated = await updateProject(id, { name, url, gaPropertyId, status });

      console.log(`[Projects] Updated: ${id}`);

      return res.status(200).json({ project: updated });
    } catch (error) {
      console.error('[Projects] Error updating:', error);
      return res.status(500).json({ error: 'Failed to update project' });
    }
  }

  // DELETE - Remove projeto
  if (req.method === 'DELETE') {
    try {
      await deleteProject(id);

      console.log(`[Projects] Deleted: ${id}`);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[Projects] Error deleting:', error);
      return res.status(500).json({ error: 'Failed to delete project' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
