/**
 * API: Projects CRUD
 * GET /api/projects - Lista projetos do usuário
 * POST /api/projects - Cria novo projeto
 */

import { authenticateRequest } from '../middleware/auth.js';
import { getUserProjects, createProject } from '../../src/services/database.js';

export default async function handler(req, res) {
  const authResult = await authenticateRequest(req);

  if (!authResult.authenticated) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: authResult.error,
    });
  }

  const userId = authResult.userId;

  // GET - Lista projetos
  if (req.method === 'GET') {
    try {
      const projects = await getUserProjects(userId);
      return res.status(200).json({ projects });
    } catch (error) {
      console.error('[Projects] Error listing:', error);
      return res.status(500).json({ error: 'Failed to list projects' });
    }
  }

  // POST - Cria projeto
  if (req.method === 'POST') {
    const { name, url, gaPropertyId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    try {
      const project = await createProject(userId, name.trim(), url || null, gaPropertyId || null);

      console.log(`[Projects] Created: ${name} for user ${userId}`);

      return res.status(201).json({ project });
    } catch (error) {
      console.error('[Projects] Error creating:', error);
      return res.status(500).json({ error: 'Failed to create project' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
