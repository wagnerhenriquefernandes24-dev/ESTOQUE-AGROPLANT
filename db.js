import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('❌ ERRO: A variável de ambiente DATABASE_URL não está definida no arquivo .env.');
  console.error('   Crie o arquivo .env e adicione a URL de conexão do PostgreSQL/Neon.tech.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necessário para alguns bancos gerenciados como Neon.tech
  }
});

pool.on('error', (err, client) => {
  console.error('❌ ERRO Inesperado no Pool do PostgreSQL:', err);
  process.exit(-1);
});

export default pool;
