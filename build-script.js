import { copyFileSync, renameSync } from 'fs';
import { join } from 'path';

// Após o build do Vite:
// 1. Renomeia dist/index.html para dist/app.html (React app)
// 2. Copia public/landing.html para dist/index.html (landing page na raiz)

const distPath = './dist';

try {
  // Renomeia o index.html do React app para app.html
  renameSync(
    join(distPath, 'index.html'),
    join(distPath, 'app.html')
  );
  console.log('✓ Renomeado dist/index.html → dist/app.html');

  // Copia a landing page para ser o index.html
  copyFileSync(
    './public/landing.html',
    join(distPath, 'index.html')
  );
  console.log('✓ Copiado public/landing.html → dist/index.html');
  
  console.log('✓ Build finalizado com sucesso!');
} catch (error) {
  console.error('Erro no build script:', error);
  process.exit(1);
}
