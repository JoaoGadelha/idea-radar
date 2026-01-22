import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    // Verificar autenticação
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // GET - Listar landing pages do usuário
    if (req.method === 'GET') {
      const landingPages = await sql`
        SELECT 
          lp.*,
          p.name as project_name
        FROM landing_pages lp
        LEFT JOIN projects p ON lp.project_id = p.id
        WHERE lp.user_id = ${userId}
        ORDER BY lp.created_at DESC
      `;

      return res.status(200).json({ landingPages });
    }

    // POST - Criar nova landing page
    if (req.method === 'POST') {
      const {
        project_id,
        slug,
        title,
        headline,
        subheadline,
        description,
        cta_text,
        primary_color,
        logo_url,
        hero_image_url,
        collect_name,
        collect_phone,
        collect_suggestions,
        thank_you_message,
        ga4_measurement_id,
        status,
      } = req.body;

      // Validações
      if (!slug || !title || !headline || !description) {
        return res.status(400).json({
          error: 'Campos obrigatórios: slug, title, headline, description',
        });
      }

      // Verificar se slug já existe
      const existing = await sql`
        SELECT id FROM landing_pages WHERE slug = ${slug}
      `;

      if (existing.length > 0) {
        return res.status(409).json({
          error: 'Slug já existe. Escolha outro.',
        });
      }

      // Criar landing page
      const [landingPage] = await sql`
        INSERT INTO landing_pages (
          user_id,
          project_id,
          slug,
          title,
          headline,
          subheadline,
          description,
          cta_text,
          primary_color,
          logo_url,
          hero_image_url,
          collect_name,
          collect_phone,
          collect_suggestions,
          thank_you_message,
          ga4_measurement_id,
          status
        ) VALUES (
          ${userId},
          ${project_id || null},
          ${slug},
          ${title},
          ${headline},
          ${subheadline || null},
          ${description},
          ${cta_text || 'Quero ser notificado!'},
          ${primary_color || '#667eea'},
          ${logo_url || null},
          ${hero_image_url || null},
          ${collect_name !== undefined ? collect_name : true},
          ${collect_phone !== undefined ? collect_phone : false},
          ${collect_suggestions !== undefined ? collect_suggestions : true},
          ${thank_you_message || 'Obrigado! Entraremos em contato em breve.'},
          ${ga4_measurement_id || null},
          ${status || 'draft'}
        )
        RETURNING *
      `;

      return res.status(201).json({ landingPage });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Erro na API de landing pages:', error);

    if (error.code === '23505') {
      // Unique violation
      return res.status(409).json({ error: 'Slug já existe' });
    }

    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
