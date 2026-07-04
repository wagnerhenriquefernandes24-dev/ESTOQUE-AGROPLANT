import db from './db.js';

async function migrate() {
  try {
    console.log('🔄 Adicionando coluna qtd_por_embalagem na tabela produtos...');
    await db.query('ALTER TABLE produtos ADD COLUMN IF NOT EXISTS qtd_por_embalagem VARCHAR(255);');
    
    console.log('🔄 Adicionando coluna qtd_por_embalagem na tabela movimentacoes...');
    await db.query('ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS qtd_por_embalagem VARCHAR(255);');

    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ ERRO na migração:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
