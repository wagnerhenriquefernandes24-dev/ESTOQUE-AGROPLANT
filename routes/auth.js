// ──────────────────────────────────────────────────────────
// routes/auth.js — Login e Logout
// ──────────────────────────────────────────────────────────
import express from 'express';
import bcrypt from 'bcryptjs';
const router = express.Router();

// GET /login
router.get('/login', (req, res) => {
  if (req.session?.user) return res.redirect('/');
  res.render('auth/login', {
    titulo: 'Login',
    erro: null
  });
});

// POST /login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const db = req.db;

  if (!username || !password) {
    return res.render('auth/login', {
      titulo: 'Login',
      erro: 'Preencha o usuário e a senha.'
    });
  }

  const { rows } = await db.query('SELECT * FROM usuarios WHERE username = $1', [username.trim().toLowerCase()]);
  const usuario = rows[0];

  if (!usuario) {
    return res.render('auth/login', {
      titulo: 'Login',
      erro: 'Usuário ou senha incorretos.'
    });
  }

  const senhaCorreta = await bcrypt.compare(password, usuario.password_hash);
  if (!senhaCorreta) {
    return res.render('auth/login', {
      titulo: 'Login',
      erro: 'Usuário ou senha incorretos.'
    });
  }

  // Cria sessão
  req.session.user = {
    id: usuario.id,
    username: usuario.username,
    nome: usuario.nome,
    role: usuario.role
  };

  res.redirect('/');
});

// POST /logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

export default router;
