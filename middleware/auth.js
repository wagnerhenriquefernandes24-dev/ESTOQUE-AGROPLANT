// ──────────────────────────────────────────────────────────
// middleware/auth.js — Guards de autenticação e autorização
// ──────────────────────────────────────────────────────────

/**
 * Injeta `res.locals.user` em todas as views.
 * Deve ser aplicado globalmente ANTES das rotas.
 */
export function injectUser(req, res, next) {
  res.locals.user = req.session?.user || null;
  next();
}

/**
 * Garante que o usuário está autenticado.
 * Redireciona para /login caso contrário.
 */
export function requireLogin(req, res, next) {
  if (!req.session?.user) {
    return res.redirect('/login');
  }
  next();
}

/**
 * Garante que o usuário autenticado é administrador.
 * Retorna 403 caso contrário.
 */
export function requireAdmin(req, res, next) {
  if (!req.session?.user) {
    return res.redirect('/login');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('403', {
      titulo: 'Acesso Negado',
      paginaAtiva: ''
    });
  }
  next();
}
