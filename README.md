# 🌱 ESTOQUE AGROPLANT

Sistema SaaS de Controle de Estoque para o Setor Agrícola.

## 🛠️ Pré-requisitos

- **Node.js v18+** instalado ([baixar em nodejs.org](https://nodejs.org))
- Confirme com: `node --version` e `npm --version`

## 🚀 Como Iniciar

### 1. Instale as dependências
```bash
npm install
```

### 2. Inicie o servidor
```bash
# Modo produção
npm start

# Modo desenvolvimento (auto-reload)
npm run dev
```

### 3. Acesse no navegador
```
http://localhost:3000
```

---

## 📁 Estrutura do Projeto

```
Teste Estoque/
├── data/
│   └── db.json              ← Banco de dados (criado automaticamente)
├── public/
│   └── css/
│       └── style.css        ← Estilos (tema verde/light)
├── routes/
│   ├── dashboard.js         ← Rota: Dashboard + KPIs + Gráficos
│   ├── produtos.js          ← Rota: CRUD de Produtos
│   └── movimentacoes.js     ← Rota: Entradas e Saídas
├── views/
│   ├── partials/
│   │   ├── header.ejs       ← Cabeçalho, sidebar, topbar
│   │   └── footer.ejs       ← Rodapé, scripts globais
│   ├── produtos/
│   │   ├── index.ejs        ← Lista de produtos
│   │   └── form.ejs         ← Formulário criar/editar
│   ├── movimentacoes/
│   │   └── index.ejs        ← Registrar e listar movimentações
│   └── index.ejs            ← Dashboard principal
├── server.js                ← Servidor Express + Banco (lowdb)
├── package.json
└── README.md
```

## ⚙️ Funcionalidades

| Módulo | Recurso |
|---|---|
| **Dashboard** | KPI cards (total itens, valor em estoque, alertas) |
| **Dashboard** | Gráfico barras: Entradas vs Saídas do mês |
| **Dashboard** | Gráfico rosca: Distribuição por Categoria |
| **Dashboard** | Tabela de últimas movimentações |
| **Produtos** | Listar com busca e filtro por categoria |
| **Produtos** | Criar / Editar / Excluir |
| **Produtos** | Alerta de estoque baixo |
| **Movimentações** | Registrar Entrada ou Saída |
| **Movimentações** | Atualização automática do estoque |
| **Movimentações** | Histórico com filtros |

## 📦 Dependências (sem compilação nativa!)

- `express` — servidor web
- `ejs` — motor de templates
- `lowdb` v7 — banco JSON 100% JavaScript
- `uuid` — IDs únicos

> ✅ **Nenhuma dependência nativa**: sem sqlite3, sem node-gyp, sem Python ou Build Tools!
