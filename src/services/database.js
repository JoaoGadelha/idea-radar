/**
 * Database Service - IdeaRadar
 * 
 * Conexão com Neon PostgreSQL
 */

import { sql } from '@vercel/postgres';

// Helper para queries raw
export async function query(text, params = []) {
  return sql.query(text, params);
}

// ==================== USERS ====================

export async function createUser(email) {
  try {
    const result = await sql`
      INSERT INTO users (email)
      VALUES (${email})
      RETURNING id, email, created_at
    `;
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new Error('Email already exists');
    }
    throw error;
  }
}

export async function getUserByEmail(email) {
  const result = await sql`
    SELECT id, email, email_verified, created_at
    FROM users
    WHERE email = ${email}
  `;
  return result.rows[0] || null;
}

export async function getUserById(userId) {
  const result = await sql`
    SELECT id, email, email_verified, created_at
    FROM users
    WHERE id = ${userId}
  `;
  return result.rows[0] || null;
}

export async function verifyUserEmail(userId) {
  const result = await sql`
    UPDATE users
    SET email_verified = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
    RETURNING id, email, email_verified
  `;
  return result.rows[0];
}

// ==================== PROJECTS ====================

export async function createProject(userId, name, url, gaPropertyId = null) {
  const result = await sql`
    INSERT INTO projects (user_id, name, url, ga_property_id)
    VALUES (${userId}, ${name}, ${url}, ${gaPropertyId})
    RETURNING id, name, url, ga_property_id, status, created_at
  `;
  return result.rows[0];
}

export async function getUserProjects(userId) {
  const result = await sql`
    SELECT id, name, url, ga_property_id, status, created_at
    FROM projects
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function getProjectById(projectId) {
  const result = await sql`
    SELECT id, user_id, name, url, ga_property_id, status, created_at
    FROM projects
    WHERE id = ${projectId}
  `;
  return result.rows[0] || null;
}

export async function updateProject(projectId, data) {
  const { name, url, gaPropertyId, status } = data;
  const result = await sql`
    UPDATE projects
    SET 
      name = COALESCE(${name}, name),
      url = COALESCE(${url}, url),
      ga_property_id = COALESCE(${gaPropertyId}, ga_property_id),
      status = COALESCE(${status}, status)
    WHERE id = ${projectId}
    RETURNING id, name, url, ga_property_id, status
  `;
  return result.rows[0];
}

export async function deleteProject(projectId) {
  await sql`DELETE FROM projects WHERE id = ${projectId}`;
}

// ==================== METRICS ====================

export async function saveMetrics(projectId, metrics) {
  const {
    date,
    sessions,
    users,
    bounceRate,
    avgSessionDuration,
    ctaClicks,
    conversions,
    conversionRate,
  } = metrics;

  const result = await sql`
    INSERT INTO metrics (
      project_id, date, sessions, users, bounce_rate, 
      avg_session_duration, cta_clicks, conversions, conversion_rate
    )
    VALUES (
      ${projectId}, ${date}, ${sessions}, ${users}, ${bounceRate},
      ${avgSessionDuration}, ${ctaClicks}, ${conversions}, ${conversionRate}
    )
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
  `;
  return result.rows[0];
}

export async function getProjectMetrics(projectId, days = 30) {
  const result = await sql`
    SELECT *
    FROM metrics
    WHERE project_id = ${projectId}
      AND date >= CURRENT_DATE - CAST(${days} AS INTEGER)
    ORDER BY date DESC
  `;
  return result.rows;
}

export async function getLatestMetricsForAllProjects(userId) {
  const result = await sql`
    SELECT DISTINCT ON (p.id)
      p.id as project_id,
      p.name as project_name,
      p.url,
      p.status,
      m.date,
      m.sessions,
      m.users,
      m.bounce_rate,
      m.avg_session_duration,
      m.cta_clicks,
      m.conversions,
      m.conversion_rate
    FROM projects p
    LEFT JOIN metrics m ON p.id = m.project_id
    WHERE p.user_id = ${userId}
    ORDER BY p.id, m.date DESC NULLS LAST
  `;
  return result.rows;
}

// ==================== LEADS ====================

export async function saveLead(projectId, email, source = null, nome = null, telefone = null, sugestao = null, metadata = null) {
  // Verificar limite de 5 registros por email
  const emailCount = await sql`
    SELECT COUNT(*) as total
    FROM leads
    WHERE project_id = ${projectId} AND email = ${email}
  `;
  
  if (parseInt(emailCount.rows[0].total, 10) >= 5) {
    throw new Error('Limite de 5 cadastros por email atingido');
  }
  
  // Extrair qualidade do email do metadata
  const emailQuality = metadata?.email?.type || null;
  
  // Verificar limite de 5 registros por telefone (se fornecido)
  if (telefone) {
    const phoneCount = await sql`
      SELECT COUNT(*) as total
      FROM leads
      WHERE project_id = ${projectId} AND telefone = ${telefone}
    `;
    
    if (parseInt(phoneCount.rows[0].total, 10) >= 5) {
      throw new Error('Limite de 5 cadastros por telefone atingido');
    }
  }
  
  // Se passou nas verificações, inserir normalmente (com metadata se disponível)
  const result = await sql`
    INSERT INTO leads (project_id, email, source, nome, telefone, sugestao, metadata, email_quality, created_at)
    VALUES (${projectId}, ${email}, ${source}, ${nome}, ${telefone}, ${sugestao}, ${metadata ? JSON.stringify(metadata) : null}, ${emailQuality}, NOW())
    RETURNING id, email, nome, telefone, sugestao, source, metadata, email_quality, created_at
  `;
  return result.rows[0];
}

export async function getProjectLeads(projectId) {
  const result = await sql`
    SELECT id, email, nome, telefone, sugestao, source, metadata, email_quality, created_at
    FROM leads
    WHERE project_id = ${projectId}
    ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function countProjectLeads(projectId) {
  const result = await sql`
    SELECT COUNT(*) as total
    FROM leads
    WHERE project_id = ${projectId}
  `;
  return parseInt(result.rows[0].total, 10);
}

// ==================== ANALYSES ====================

export async function saveAnalysis(userId, question, answer, projectsContext) {
  const result = await sql`
    INSERT INTO analyses (user_id, question, answer, projects_context)
    VALUES (${userId}, ${question}, ${answer}, ${JSON.stringify(projectsContext)})
    RETURNING id, question, answer, created_at
  `;
  return result.rows[0];
}

export async function getUserAnalyses(userId, limit = 20) {
  const result = await sql`
    SELECT id, question, answer, created_at
    FROM analyses
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return result.rows;
}

// ==================== HEALTH CHECK ====================

export async function healthCheck() {
  try {
    await sql`SELECT 1`;
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

export default {
  query,
  createUser,
  getUserByEmail,
  getUserById,
  verifyUserEmail,
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  saveMetrics,
  getProjectMetrics,
  getLatestMetricsForAllProjects,
  saveLead,
  getProjectLeads,
  countProjectLeads,
  saveAnalysis,
  getUserAnalyses,
  healthCheck,
};
