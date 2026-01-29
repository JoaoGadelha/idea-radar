import { neon } from '@neondatabase/serverless';
import { authenticateRequest } from '../middleware/auth.js';
import { canGenerateLP, consumeLPCredit } from '../config/plans.js';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  const authResult = await authenticateRequest(req);

  if (!authResult.authenticated) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: authResult.error,
    });
  }

  const userId = authResult.userId;

  try {

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

    // POST - Criar nova landing page (com projeto automático se necessário)
    if (req.method === 'POST') {
      // 🔒 VERIFICAR CRÉDITOS ANTES
      const creditCheck = await canGenerateLP(userId);
      if (!creditCheck.allowed) {
        return res.status(403).json({
          error: 'Sem créditos disponíveis',
          message: 'Você precisa comprar créditos para criar mais landing pages.',
          remaining: creditCheck.remaining,
          total: creditCheck.total,
        });
      }

      const {
        // Dados para criar projeto automaticamente
        project_name,
        project_description,
        // Dados da landing page
        project_id,
        slug,
        title,
        headline,
        subheadline,
        description,
        cta_text,
        value_proposition,
        how_it_works,
        faq_items,
        cta_headline,
        cta_subheadline,
        primary_color,
        template,
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

      // Criar projeto automaticamente se não tiver project_id
      let finalProjectId = project_id;
      if (!finalProjectId && project_name) {
        const [newProject] = await sql`
          INSERT INTO projects (user_id, name, url)
          VALUES (${userId}, ${project_name}, ${`https://idea-radar-react.vercel.app/l/${slug}`})
          RETURNING id
        `;
        finalProjectId = newProject.id;
      }

      // Criar landing page (usando apenas colunas que existem na tabela original)
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
          ${finalProjectId || null},
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

      // 🔥 CONSUMIR CRÉDITO APÓS SUCESSO
      const consumed = await consumeLPCredit(userId);
      if (!consumed.success) {
        console.error('[LP Creation] Failed to consume credit after creating LP:', consumed);
        // LP já foi criada, mas crédito não foi consumido - log para investigar
      }

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
