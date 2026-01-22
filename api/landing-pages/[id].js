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

    const { id } = req.query;

    // GET - Buscar landing page específica
    if (req.method === 'GET') {
      const [landingPage] = await sql`
        SELECT 
          lp.*,
          p.name as project_name
        FROM landing_pages lp
        LEFT JOIN projects p ON lp.project_id = p.id
        WHERE lp.id = ${id} AND lp.user_id = ${userId}
      `;

      if (!landingPage) {
        return res.status(404).json({ error: 'Landing page não encontrada' });
      }

      return res.status(200).json({ landingPage });
    }

    // PUT - Atualizar landing page
    if (req.method === 'PUT') {
      const {
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

      // Verificar se landing page existe e pertence ao usuário
      const [existing] = await sql`
        SELECT id FROM landing_pages 
        WHERE id = ${id} AND user_id = ${userId}
      `;

      if (!existing) {
        return res.status(404).json({ error: 'Landing page não encontrada' });
      }

      // Se mudou o slug, verificar se novo slug já existe
      if (slug) {
        const [slugExists] = await sql`
          SELECT id FROM landing_pages 
          WHERE slug = ${slug} AND id != ${id}
        `;

        if (slugExists) {
          return res.status(409).json({ error: 'Slug já existe' });
        }
      }

      // Atualizar apenas campos fornecidos
      const updates = {};
      if (slug !== undefined) updates.slug = slug;
      if (title !== undefined) updates.title = title;
      if (headline !== undefined) updates.headline = headline;
      if (subheadline !== undefined) updates.subheadline = subheadline;
      if (description !== undefined) updates.description = description;
      if (cta_text !== undefined) updates.cta_text = cta_text;
      if (primary_color !== undefined) updates.primary_color = primary_color;
      if (logo_url !== undefined) updates.logo_url = logo_url;
      if (hero_image_url !== undefined) updates.hero_image_url = hero_image_url;
      if (collect_name !== undefined) updates.collect_name = collect_name;
      if (collect_phone !== undefined) updates.collect_phone = collect_phone;
      if (collect_suggestions !== undefined) updates.collect_suggestions = collect_suggestions;
      if (thank_you_message !== undefined) updates.thank_you_message = thank_you_message;
      if (ga4_measurement_id !== undefined) updates.ga4_measurement_id = ga4_measurement_id;
      if (status !== undefined) {
        updates.status = status;
        if (status === 'published') {
          updates.published_at = new Date();
        }
      }

      const [landingPage] = await sql`
        UPDATE landing_pages
        SET ${sql(updates)}
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *
      `;

      return res.status(200).json({ landingPage });
    }

    // DELETE - Deletar landing page
    if (req.method === 'DELETE') {
      const [existing] = await sql`
        SELECT id FROM landing_pages 
        WHERE id = ${id} AND user_id = ${userId}
      `;

      if (!existing) {
        return res.status(404).json({ error: 'Landing page não encontrada' });
      }

      await sql`
        DELETE FROM landing_pages 
        WHERE id = ${id} AND user_id = ${userId}
      `;

      return res.status(200).json({ message: 'Landing page deletada com sucesso' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Erro na API de landing pages:', error);

    if (error.code === '23505') {
      return res.status(409).json({ error: 'Slug já existe' });
    }

    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
