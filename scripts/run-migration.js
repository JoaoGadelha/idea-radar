/**
 * Script para executar migrations
 * Execute: node scripts/run-migration.js
 */

import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runMigration(filename) {
  console.log(`🔄 Executando migration: ${filename}`);
  
  try {
    const sqlPath = join(__dirname, '..', 'migrations', filename);
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    // Dividir por ; para executar múltiplos comandos
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      console.log(`  📝 ${statement.substring(0, 60)}...`);
      await sql.query(statement);
    }
    
    console.log(`✅ Migration ${filename} executada com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro na migration ${filename}:`, error.message);
    throw error;
  }
}

// Executar migration específica ou todas
const migrationFile = process.argv[2];

if (migrationFile) {
  await runMigration(migrationFile);
} else {
  // Executar todas as migrations pendentes
  console.log('Especifique o arquivo: node scripts/run-migration.js <filename.sql>');
  console.log('\nMigrations disponíveis:');
  console.log('  - add_stripe_idempotency_index.sql');
}

process.exit(0);
