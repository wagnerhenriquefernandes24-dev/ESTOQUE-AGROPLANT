import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
const router = express.Router();

// ── Listar movimentações (qualquer usuário logado) ──
router.get('/', async (req, res) => {
  const db = req.db;

  const filtroTipo    = req.query.tipo    || '';
  const filtroProduto = req.query.produto ? parseInt(req.query.produto, 10) : '';
  const abaAtiva      = req.query.aba     || 'entrada';

  // Obter todos os produtos para o select
  const { rows: produtos } = await db.query('SELECT * FROM produtos ORDER BY nome ASC');

  let query = `
    SELECT m.*, p.nome as "nomeProduto", p.unidade 
    FROM movimentacoes m 
    LEFT JOIN produtos p ON p.id = m.produto_id
  `;
  
  let conditions = [];
  let values = [];

  if (filtroTipo) {
    conditions.push(`m.tipo = $${values.length + 1}`);
    values.push(filtroTipo);
  }
  if (filtroProduto) {
    conditions.push(`m.produto_id = $${values.length + 1}`);
    values.push(parseInt(filtroProduto, 10));
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY m.data DESC';

  const { rows: movimentacoes } = await db.query(query, values);

  // Mapear camelCase para as views
  const listaEnriquecida = movimentacoes.map(m => ({
    ...m,
    produtoId: m.produto_id,
    dataInput: m.data_input,
    quantidadeAnterior: m.quantidade_anterior,
    quantidadeNova: m.quantidade_nova,
    isEmprestimo: m.is_emprestimo,
    nomeEmprestimo: m.nome_emprestimo
  }));

  // Data padrão = hoje no formato YYYY-MM-DD local
  const hoje = new Date().toLocaleDateString('en-CA');

  res.render('movimentacoes/index', {
    titulo: 'Movimentações de Estoque',
    paginaAtiva: 'movimentacoes',
    movimentacoes: listaEnriquecida,
    produtos,
    filtroTipo,
    filtroProduto,
    abaAtiva,
    hoje,
    mensagem: req.query.msg || null,
    tipoMensagem: req.query.tipo_msg || 'sucesso'
  });
});

// ── Registrar movimentação (apenas admin) ──
router.post('/', requireAdmin, async (req, res) => {
  const db = req.db;
  const { produtoId, tipo, quantidade, dataMov, isEmprestimo, nomeEmprestimo } = req.body;
  const qtd = parseFloat(quantidade);
  const idProduto = parseInt(produtoId, 10);

  if (!produtoId || !tipo || isNaN(qtd) || qtd <= 0) {
    return res.redirect(`/movimentacoes?aba=${tipo || 'entrada'}&msg=Dados+inválidos.+Verifique+os+campos.&tipo_msg=erro`);
  }

  if (!dataMov) {
    return res.redirect(`/movimentacoes?aba=${tipo}&msg=Informe+a+data+da+movimentação.&tipo_msg=erro`);
  }

  const flagEmprestimo = isEmprestimo === 'on' || isEmprestimo === 'true';

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Obter produto travando a linha (FOR UPDATE)
    const { rows } = await client.query('SELECT * FROM produtos WHERE id = $1 FOR UPDATE', [idProduto]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.redirect(`/movimentacoes?aba=${tipo}&msg=Produto+não+encontrado.&tipo_msg=erro`);
    }
    const produto = rows[0];

    if (tipo === 'saida' && parseFloat(produto.quantidade) < qtd) {
      await client.query('ROLLBACK');
      return res.redirect(`/movimentacoes?aba=saida&msg=Quantidade+insuficiente+em+estoque.+Disponível:+${produto.quantidade}+${produto.unidade}.&tipo_msg=erro`);
    }

    const qtdAnterior = parseFloat(produto.quantidade);
    const qtdNova = tipo === 'entrada' ? qtdAnterior + qtd : qtdAnterior - qtd;

    // Atualiza saldo do produto
    await client.query('UPDATE produtos SET quantidade = $1, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2', [qtdNova, idProduto]);

    const dataISO = new Date(`${dataMov}T12:00:00`).toISOString();

    // Insere movimentação
    const resultMov = await client.query(
      `INSERT INTO movimentacoes 
       (produto_id, tipo, quantidade, data, data_input, quantidade_anterior, quantidade_nova, is_emprestimo, nome_emprestimo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [idProduto, tipo, qtd, dataISO, dataMov, qtdAnterior, qtdNova, flagEmprestimo, flagEmprestimo ? (nomeEmprestimo || '') : null]
    );

    await client.query('COMMIT');
    
    const novaMovimentacao = resultMov.rows[0];
    
    // Formatar camelCase
    const movCamel = {
      id: novaMovimentacao.id,
      produtoId: novaMovimentacao.produto_id,
      tipo: novaMovimentacao.tipo,
      quantidade: parseFloat(novaMovimentacao.quantidade),
      data: novaMovimentacao.data,
      dataInput: novaMovimentacao.data_input,
      quantidadeAnterior: parseFloat(novaMovimentacao.quantidade_anterior),
      quantidadeNova: parseFloat(novaMovimentacao.quantidade_nova),
      isEmprestimo: novaMovimentacao.is_emprestimo,
      nomeEmprestimo: novaMovimentacao.nome_emprestimo
    };

    // Notifica clientes
    req.io.emit('estoque:atualizado', {
      tipo: 'movimentacao_registrada',
      movimentacao: movCamel,
      produto: { id: produto.id, nome: produto.nome, quantidade: qtdNova }
    });

    res.redirect(`/movimentacoes?aba=historico&msg=Movimentação+registrada+com+sucesso!&tipo_msg=sucesso`);

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Erro na transação de movimentação:', e);
    res.redirect(`/movimentacoes?aba=${tipo}&msg=Erro+interno+no+servidor.&tipo_msg=erro`);
  } finally {
    client.release();
  }
});

export default router;
