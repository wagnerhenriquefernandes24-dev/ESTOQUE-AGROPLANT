import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
const router = express.Router();

const UNIDADES = ['Litros (L)', 'Quilogramas (Kg)', 'Toneladas (Ton)', 'Sacas', 'Gramas (g)', 'Unidades (Un)'];

// ── Listar produtos (qualquer usuário logado) ──
router.get('/', async (req, res) => {
  const db = req.db;
  
  const busca = req.query.busca || '';
  const categoria = req.query.categoria || '';

  let query = 'SELECT * FROM produtos';
  let values = [];
  let conditions = [];

  if (busca) {
    conditions.push(`nome ILIKE $${values.length + 1}`);
    values.push(`%${busca}%`);
  }
  
  if (categoria) {
    conditions.push(`categoria = $${values.length + 1}`);
    values.push(categoria);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY nome ASC';

  const { rows: produtos } = await db.query(query, values);
  
  // Obter categorias únicas para o filtro
  const { rows: catRows } = await db.query('SELECT DISTINCT categoria FROM produtos WHERE categoria IS NOT NULL');
  const categorias = catRows.map(r => r.categoria);

  res.render('produtos/index', {
    titulo: 'Gestão de Produtos',
    paginaAtiva: 'produtos',
    produtos,
    categorias,
    busca,
    categoriaFiltro: categoria,
    mensagem: req.query.msg || null,
    tipoMensagem: req.query.tipo_msg || 'sucesso'
  });
});

// ── Formulário novo produto (apenas admin) ──
router.get('/novo', requireAdmin, (req, res) => {
  res.render('produtos/form', {
    titulo: 'Novo Produto',
    paginaAtiva: 'produtos',
    produto: null,
    unidades: UNIDADES,
    erro: null
  });
});

// ── Criar produto (apenas admin) ──
router.post('/', requireAdmin, async (req, res) => {
  const db = req.db;
  const { nome, categoria, unidade, quantidade, quantidadeMinima, preco } = req.body;

  if (!nome || !categoria || !unidade || quantidade === '' || quantidadeMinima === '' || preco === '') {
    return res.render('produtos/form', {
      titulo: 'Novo Produto',
      paginaAtiva: 'produtos',
      produto: req.body,
      unidades: UNIDADES,
      erro: 'Por favor, preencha todos os campos obrigatórios.'
    });
  }

  const result = await db.query(
    `INSERT INTO produtos (nome, categoria, unidade, quantidade, quantidade_minima, preco)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      nome.trim(),
      categoria.trim(),
      unidade,
      parseFloat(quantidade),
      parseFloat(quantidadeMinima),
      parseFloat(preco)
    ]
  );
  
  const novoProduto = result.rows[0];

  // Notifica clientes em tempo real (mapeia colunas DB para as chaves originais esperadas, se necessário)
  req.io.emit('estoque:atualizado', { tipo: 'produto_criado', produto: { ...novoProduto, quantidadeMinima: novoProduto.quantidade_minima } });

  res.redirect('/produtos?msg=Produto+cadastrado+com+sucesso!&tipo_msg=sucesso');
});

// ── Formulário editar produto (apenas admin) ──
router.get('/:id/editar', requireAdmin, async (req, res) => {
  const db = req.db;
  const { rows } = await db.query('SELECT * FROM produtos WHERE id = $1', [parseInt(req.params.id, 10)]);
  const produto = rows[0];

  if (!produto) return res.redirect('/produtos?msg=Produto+não+encontrado.&tipo_msg=erro');
  
  // Mapear snake_case para camelCase para a view (quantidade_minima -> quantidadeMinima)
  produto.quantidadeMinima = produto.quantidade_minima;

  res.render('produtos/form', {
    titulo: 'Editar Produto',
    paginaAtiva: 'produtos',
    produto,
    unidades: UNIDADES,
    erro: null
  });
});

// ── Atualizar produto (apenas admin) ──
router.post('/:id/editar', requireAdmin, async (req, res) => {
  const db = req.db;
  const id = parseInt(req.params.id, 10);
  const { nome, categoria, unidade, quantidade, quantidadeMinima, preco } = req.body;

  const result = await db.query(
    `UPDATE produtos 
     SET nome = $1, categoria = $2, unidade = $3, quantidade = $4, quantidade_minima = $5, preco = $6, atualizado_em = CURRENT_TIMESTAMP
     WHERE id = $7 RETURNING *`,
    [
      nome.trim(),
      categoria.trim(),
      unidade,
      parseFloat(quantidade),
      parseFloat(quantidadeMinima),
      parseFloat(preco),
      id
    ]
  );

  if (result.rowCount === 0) return res.redirect('/produtos?msg=Produto+não+encontrado.&tipo_msg=erro');

  const produtoAtualizado = result.rows[0];

  // Notifica clientes em tempo real
  req.io.emit('estoque:atualizado', { tipo: 'produto_atualizado', produto: { ...produtoAtualizado, quantidadeMinima: produtoAtualizado.quantidade_minima } });

  res.redirect('/produtos?msg=Produto+atualizado+com+sucesso!&tipo_msg=sucesso');
});

// ── Excluir produto (apenas admin) ──
router.post('/:id/excluir', requireAdmin, async (req, res) => {
  const db = req.db;
  const id = parseInt(req.params.id, 10);
  
  // ON DELETE CASCADE no schema irá remover as movimentações automaticamente
  await db.query('DELETE FROM produtos WHERE id = $1', [id]);

  // Notifica clientes em tempo real
  req.io.emit('estoque:atualizado', { tipo: 'produto_excluido', produtoId: id });

  res.redirect('/produtos?msg=Produto+excluído+com+sucesso!&tipo_msg=sucesso');
});

export default router;
