/**
 * Email Service - IdeaRadar
 * 
 * Serviço centralizado para envio de emails via Resend
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'IdeaRadar <onboarding@resend.dev>';

/**
 * Template de notificação de novo lead
 */
function newLeadTemplate(lead, project) {
  const { email, nome, telefone, sugestao, metadata } = lead;
  
  const emailQuality = metadata?.email?.type || 'desconhecido';
  const device = metadata?.device?.device || 'desconhecido';
  const utmSource = metadata?.utm?.utm_source || 'direto';
  
  const qualityBadge = {
    corporate: '🏢 Corporativo',
    personal: '👤 Pessoal',
    educational: '🎓 Educacional',
    disposable: '⚠️ Descartável',
    unknown: '❓ Desconhecido'
  }[emailQuality] || '❓ Desconhecido';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 48px; margin-bottom: 8px;">🎯</div>
      <h1 style="margin: 0; font-size: 24px; color: #18181b;">Novo Lead!</h1>
      <p style="margin: 8px 0 0; color: #71717a; font-size: 14px;">
        ${project.name}
      </p>
    </div>
    
    <!-- Card -->
    <div style="background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
      <!-- Lead Info -->
      <div style="padding: 24px; border-bottom: 1px solid #e4e4e7;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 14px; width: 100px;">Email</td>
            <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 500;">
              <a href="mailto:${email}" style="color: #6366f1; text-decoration: none;">${email}</a>
            </td>
          </tr>
          ${nome ? `
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Nome</td>
            <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 500;">${nome}</td>
          </tr>
          ` : ''}
          ${telefone ? `
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Telefone</td>
            <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 500;">
              <a href="tel:${telefone}" style="color: #6366f1; text-decoration: none;">${telefone}</a>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Qualidade</td>
            <td style="padding: 8px 0; color: #18181b; font-size: 14px;">${qualityBadge}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Dispositivo</td>
            <td style="padding: 8px 0; color: #18181b; font-size: 14px;">${device === 'mobile' ? '📱 Mobile' : '💻 Desktop'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Origem</td>
            <td style="padding: 8px 0; color: #18181b; font-size: 14px;">${utmSource}</td>
          </tr>
        </table>
      </div>
      
      ${sugestao ? `
      <!-- Sugestão -->
      <div style="padding: 24px; background: #fafafa;">
        <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
          💬 Sugestão/Comentário
        </p>
        <p style="margin: 0; color: #18181b; font-size: 14px; line-height: 1.6; font-style: italic;">
          "${sugestao}"
        </p>
      </div>
      ` : ''}
      
      <!-- CTA -->
      <div style="padding: 24px; text-align: center;">
        <a href="https://idea-radar-react.vercel.app/dashboard" 
           style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Ver no Dashboard →
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
        IdeaRadar • Validação de Ideias com IA
      </p>
      <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 12px;">
        <a href="https://idea-radar-react.vercel.app/dashboard" style="color: #a1a1aa;">Configurar notificações</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
🎯 Novo Lead - ${project.name}

Email: ${email}
${nome ? `Nome: ${nome}` : ''}
${telefone ? `Telefone: ${telefone}` : ''}
Qualidade: ${qualityBadge}
Dispositivo: ${device}
Origem: ${utmSource}

${sugestao ? `Sugestão: "${sugestao}"` : ''}

Ver no Dashboard: https://idea-radar-react.vercel.app/dashboard
`;

  return { html, text };
}

/**
 * Envia notificação de novo lead para o dono do projeto
 */
export async function sendLeadNotification(lead, project, ownerEmail) {
  try {
    // Não enviar se Resend estiver desabilitado
    if (process.env.DISABLE_RESEND === 'true') {
      console.log('[Email] Resend disabled, skipping lead notification');
      return { success: true, skipped: true };
    }

    const { html, text } = newLeadTemplate(lead, project);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: ownerEmail,
      subject: `🎯 Novo lead: ${lead.nome || lead.email} - ${project.name}`,
      html,
      text,
      tags: [
        { name: 'category', value: 'lead_notification' },
        { name: 'project_id', value: String(project.id) }
      ]
    });

    console.log(`[Email] Lead notification sent to ${ownerEmail} for project ${project.name}`);
    return { success: true, id: result.id };
  } catch (error) {
    console.error('[Email] Error sending lead notification:', error);
    return { success: false, error: error.message };
  }
}
