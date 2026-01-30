import { copyFileSync, renameSync } from 'fs';
import { join } from 'path';

// Após o build do Vite:
// 1. Faz cópia de dist/index.html para dist/app.html (para rewrites do Vercel)
// 2. Mantém dist/index.html como está (React app na raiz)

const distPath = './dist';

try {
  // Copia index.html para app.html (usado pelos rewrites do vercel.json)
  copyFileSync(
    join(distPath, 'index.html'),
    join(distPath, 'app.html')
  );
  console.log('✓ Copiado dist/index.html → dist/app.html');
  console.log('✓ Build finalizado com sucesso!');
} catch (error) {
  console.error('Erro no build script:', error);
  process.exit(1);
}
