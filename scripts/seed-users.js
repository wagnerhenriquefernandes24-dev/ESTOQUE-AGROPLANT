// ══════════════════════════════════════════════════════════
// scripts/seed-users.js
// Cria / atualiza os usuários no PostgreSQL
//
// Como usar:
//   1. Edite o arquivo .env e defina ADMIN_PASSWORD=SuaSenhaForte
//   2. Execute: node scripts/seed-users.js
// ══════════════════════════════════════════════════════════
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db from '../db.js';

// ── Lê senha do administrador do .env ──────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD || ADMIN_PASSWORD === 'SuaSenhaFortaAqui!') {
  console.error('\n❌ ERRO: Defina ADMIN_PASSWORD no arquivo .env antes de executar este script.');
  console.error('   Exemplo: ADMIN_PASSWORD=Wagner@2025#Cana\n');
  process.exit(1);
}

const SALT_ROUNDS = 12;

async function seed() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    // ── Remove usuários antigos ─────────────────────────────
    console.log('🧹 Limpando usuários legados (admin, wagner_admin, viewer)...');
    await db.query(\`
      DELETE FROM usuarios 
      WHERE username IN ('admin', 'wagner_admin', 'viewer')
    \`);

    // ── Cria usuários novos ─────────────────────────────────
    const hashAdmin = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    const hashViewer = await bcrypt.hash('viewer123', SALT_ROUNDS);

    console.log('🌱 Semeando novos usuários...');
    
    await db.query(
      'INSERT INTO usuarios (username, password_hash, role, nome) VALUES ($1, $2, $3, $4)',
      ['wagner_admin', hashAdmin, 'admin', 'Wagner Henrique (Admin)']
    );

    await db.query(
      'INSERT INTO usuarios (username, password_hash, role, nome) VALUES ($1, $2, $3, $4)',
      ['viewer', hashViewer, 'viewer', 'Acesso Leitura']
    );

    console.log('✅ Usuários criados com sucesso no banco de dados!');
    console.log('   - wagner_admin');
    console.log('   - viewer');
    console.log('\n🔒 Lembre-se: O viewer tem acesso apenas de leitura nas views (sem permissão de admin).');

  } catch (error) {
    console.error('❌ ERRO ao semear usuários:', error);
  } finally {
    process.exit(0);
  }
}

seed();
