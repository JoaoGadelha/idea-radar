/**
 * Magic Link Email Template
 */
export function magicLinkTemplate(magicLink, email) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - IdeaRadar</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 28px; color: #1a1a1a; margin: 0;">📡 IdeaRadar</h1>
    </div>
    
    <p style="font-size: 16px; color: #333; line-height: 1.6;">
      Olá! Clique no botão abaixo para entrar no IdeaRadar:
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${magicLink}" 
         style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Entrar no IdeaRadar
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; line-height: 1.6;">
      Ou copie e cole este link no navegador:<br>
      <a href="${magicLink}" style="color: #6366f1; word-break: break-all;">${magicLink}</a>
    </p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      Este link expira em 15 minutos.<br>
      Se você não solicitou este email, pode ignorá-lo.
    </p>
  </div>
</body>
</html>
`;

  const text = `
IdeaRadar - Login

Clique no link abaixo para entrar:
${magicLink}

Este link expira em 15 minutos.
Se você não solicitou este email, pode ignorá-lo.
`;

  return { html, text };
}
