import 'dotenv/config'; // ← carrega o .env ANTES de qualquer outra coisa
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import fs from 'fs';
import db from './db.js';

import { injectUser, requireLogin } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ────────────────────────────────────────────────
// Banco de dados (PostgreSQL)
// ────────────────────────────────────────────────
const schemaFile = join(__dirname, 'db', 'schema.sql');
const schemaSql = fs.readFileSync(schemaFile, 'utf8');

// Garante as tabelas
await db.query(schemaSql);

// ── Seed automático: garante que sempre existe pelo menos um admin ──
const { rows: usuariosCount } = await db.query('SELECT COUNT(*) as qtd FROM usuarios');
if (parseInt(usuariosCount[0].qtd) === 0) {
  const senhaAdmin = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(senhaAdmin, 12);
  await db.query(
    'INSERT INTO usuarios (username, password_hash, role, nome) VALUES ($1, $2, $3, $4)',
    ['wagner_admin', hash, 'admin', 'Administrador']
  );
  console.log('⚠️  Nenhum usuário encontrado. Admin padrão criado (usuário: wagner_admin).');
  if (!process.env.ADMIN_PASSWORD) {
    console.log('   Senha padrão: admin123 — defina ADMIN_PASSWORD no .env e rode: node scripts/seed-users.js');
  }
}

// ────────────────────────────────────────────────
// Express + HTTP + Socket.io
// ────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);
const io = new SocketIO(httpServer);

const PORT = process.env.PORT || 3000;

// ── View engine ──
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// ── Middlewares globais ──
app.use(express.static(join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Sessão ──
app.use(session({
  secret: 'agroplant-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8, // 8 horas
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// ── Disponibilizar db e io para as rotas ──
app.use((req, res, next) => {
  req.db = db;
  req.io = io;
  next();
});

// ── Injetar usuário em todas as views ──
app.use(injectUser);

// ────────────────────────────────────────────────
// Rotas
// ────────────────────────────────────────────────
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import produtosRouter from './routes/produtos.js';
import movimentacoesRouter from './routes/movimentacoes.js';

// Auth (público — login/logout)
app.use('/', authRouter);

// Rotas protegidas (requerem login)
app.use('/', requireLogin, dashboardRouter);
app.use('/produtos', requireLogin, produtosRouter);
app.use('/movimentacoes', requireLogin, movimentacoesRouter);

// ── 404 ──
app.use((req, res) => {
  res.status(404).render('404', { titulo: 'Página não encontrada', paginaAtiva: '' });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { titulo: 'Erro interno', mensagem: err.message, paginaAtiva: '' });
});

// ────────────────────────────────────────────────
// Socket.io — eventos
// ────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Socket conectado: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Socket desconectado: ${socket.id}`);
  });
});

// ────────────────────────────────────────────────
// Start
// ────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n🌱 ESTOQUE AGROPLANT rodando em http://localhost:${PORT}\n`);
});

export { db, io };
