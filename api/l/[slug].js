import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

/**
 * API Pública: Exibir Landing Page por slug
 * GET /api/l/[slug] - Buscar landing page pública
 */
export default async function handler(req, res) {
  const { slug } = req.query;

  try {
    // GET - Buscar landing page pública por slug
    if (req.method === 'GET') {
      const [landingPage] = await sql`
        SELECT 
          lp.id,
          lp.slug,
          lp.title,
          lp.headline,
          lp.subheadline,
          lp.description,
          lp.cta_text,
          lp.primary_color,
          lp.logo_url,
          lp.hero_image_url,
          lp.collect_name,
          lp.collect_phone,
          lp.collect_suggestions,
          lp.thank_you_message,
          lp.status,
          lp.project_id,
          p.name as project_name
        FROM landing_pages lp
        LEFT JOIN projects p ON lp.project_id = p.id
        WHERE lp.slug = ${slug}
      `;

      if (!landingPage) {
        return res.status(404).json({ error: 'Landing page não encontrada' });
      }

      // Só mostrar se estiver publicada ou em draft (para preview)
      // if (landingPage.status === 'archived') {
      //   return res.status(404).json({ error: 'Landing page não disponível' });
      // }

      return res.status(200).json({ landingPage });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Erro ao buscar landing page pública:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
