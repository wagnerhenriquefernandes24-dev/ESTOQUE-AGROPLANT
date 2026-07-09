import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔄 Iniciando migração de precisão decimal...');
    
    await db.query(`
      ALTER TABLE produtos 
      ALTER COLUMN preco TYPE DECIMAL(15, 4),
      ALTER COLUMN quantidade TYPE DECIMAL(15, 4),
      ALTER COLUMN quantidade_minima TYPE DECIMAL(15, 4);
    `);
    
    await db.query(`
      ALTER TABLE movimentacoes
      ALTER COLUMN quantidade TYPE DECIMAL(15, 4),
      ALTER COLUMN quantidade_anterior TYPE DECIMAL(15, 4),
      ALTER COLUMN quantidade_nova TYPE DECIMAL(15, 4);
    `);
    
    console.log('✅ Migração de precisão concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    db.end();
  }
}

runMigration();
