import express from 'express';
const router = express.Router();

router.get('/', async (req, res) => {
  const db = req.db;

  // ── Filtros globais para KPIs ──
  const kpiProduto = req.query.kpiProduto ? parseInt(req.query.kpiProduto, 10) : '';
  const kpiCategoria = req.query.kpiCategoria || '';

  let kpiConditions = [];
  let kpiValues = [];

  if (kpiProduto) {
    kpiConditions.push(`id = $${kpiValues.length + 1}`);
    kpiValues.push(parseInt(kpiProduto, 10));
  }
  if (kpiCategoria) {
    kpiConditions.push(`categoria = $${kpiValues.length + 1}`);
    kpiValues.push(kpiCategoria);
  }

  const kpiWhere = kpiConditions.length > 0 ? 'WHERE ' + kpiConditions.join(' AND ') : '';

  // ── Cards resumidos ──
  const { rows: kpiRows } = await db.query(`
    SELECT 
      COUNT(*) as total_itens,
      COALESCE(SUM(quantidade * preco), 0) as valor_estoque,
      COUNT(*) FILTER (WHERE quantidade <= quantidade_minima) as alertas_baixos
    FROM produtos
    ${kpiWhere}
  `, kpiValues);

  const kpis = kpiRows[0];
  const totalItens = parseInt(kpis.total_itens, 10);
  const valorEstoque = parseFloat(kpis.valor_estoque);
  const alertasBaixos = parseInt(kpis.alertas_baixos, 10);

  // ── Filtros globais (combos) ──
  const { rows: produtos } = await db.query('SELECT * FROM produtos ORDER BY nome ASC');
  const todasCategorias = [...new Set(produtos.map(p => p.categoria || 'Sem categoria'))].sort();

  // ── Gráfico 1: Entradas vs Saídas ──
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const filtroMes = req.query.mes !== undefined ? parseInt(req.query.mes, 10) : mesAtual;
  const filtroAno = req.query.ano ? parseInt(req.query.ano, 10) : anoAtual;
  const filtroProduto = req.query.produto ? parseInt(req.query.produto, 10) : '';

  const diasNoMes = new Date(filtroAno, filtroMes + 1, 0).getDate();
  const entradasPorDia = new Array(diasNoMes).fill(0);
  const saidasPorDia  = new Array(diasNoMes).fill(0);

  // Buscar movimentacoes filtradas para o gráfico e preencher arrays
  let movQuery = `
    SELECT EXTRACT(DAY FROM data) as dia, tipo, SUM(quantidade) as total
    FROM movimentacoes
    WHERE EXTRACT(MONTH FROM data) = $1 AND EXTRACT(YEAR FROM data) = $2
  `;
  let movValues = [filtroMes + 1, filtroAno]; // Postgres meses sao 1-12

  if (filtroProduto) {
    movQuery += ` AND produto_id = $3`;
    movValues.push(parseInt(filtroProduto, 10));
  }
  movQuery += ` GROUP BY EXTRACT(DAY FROM data), tipo`;

  const { rows: graf1Rows } = await db.query(movQuery, movValues);

  graf1Rows.forEach(r => {
    const dia = parseInt(r.dia, 10) - 1;
    if (r.tipo === 'entrada') entradasPorDia[dia] = parseFloat(r.total);
    else saidasPorDia[dia] = parseFloat(r.total);
  });

  const labelsGrafico1 = Array.from({ length: diasNoMes }, (_, i) => `${i + 1}`);

  // ── Gráfico 2: Distribuição por categoria ──
  const { rows: graf2Rows } = await db.query(`
    SELECT COALESCE(categoria, 'Sem categoria') as cat, SUM(quantidade) as total
    FROM produtos
    GROUP BY categoria
  `);
  
  const categoriasGraf2 = [];
  const dadosGraf2 = [];
  graf2Rows.forEach(r => {
    categoriasGraf2.push(r.cat);
    dadosGraf2.push(parseFloat(r.total));
  });

  // ── Últimas 10 movimentações ──
  const { rows: ultimasRows } = await db.query(`
    SELECT m.*, p.nome as "nomeProduto"
    FROM movimentacoes m
    LEFT JOIN produtos p ON p.id = m.produto_id
    ORDER BY m.data DESC
    LIMIT 10
  `);
  
  const ultimasMovimentacoes = ultimasRows.map(m => ({
    ...m,
    produtoId: m.produto_id,
    dataInput: m.data_input,
    quantidadeAnterior: m.quantidade_anterior,
    quantidadeNova: m.quantidade_nova,
    isEmprestimo: m.is_emprestimo,
    nomeEmprestimo: m.nome_emprestimo,
    nomeProduto: m.nomeProduto || 'Produto removido'
  }));

  // Lista de anos para o filtro (anos com movimentações + ano atual)
  const { rows: anosRows } = await db.query('SELECT DISTINCT EXTRACT(YEAR FROM data) as ano FROM movimentacoes');
  const anosDisponiveis = new Set([anoAtual]);
  anosRows.forEach(r => anosDisponiveis.add(parseInt(r.ano, 10)));
  const anos = Array.from(anosDisponiveis).sort((a, b) => b - a);

  res.render('index', {
    titulo: 'Dashboard',
    paginaAtiva: 'dashboard',
    totalItens,
    valorEstoque: valorEstoque.toFixed(2),
    alertasBaixos,
    labelsGrafico1: JSON.stringify(labelsGrafico1),
    entradasPorDia: JSON.stringify(entradasPorDia),
    saidasPorDia: JSON.stringify(saidasPorDia),
    labelsGrafico2: JSON.stringify(categoriasGraf2),
    dadosGrafico2: JSON.stringify(dadosGraf2),
    ultimasMovimentacoes,
    produtos: produtos.map(p => ({ ...p, quantidadeMinima: p.quantidade_minima })), // compatibilidade
    filtroMes,
    filtroAno,
    filtroProduto,
    anosDisponiveis: anos,
    kpiProduto,
    kpiCategoria,
    todasCategorias
  });
});

export default router;
