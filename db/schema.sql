-- db/schema.sql
-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    nome VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(255),
    unidade VARCHAR(50) NOT NULL,
    quantidade DECIMAL(15, 4) NOT NULL DEFAULT 0,
    quantidade_minima DECIMAL(15, 4) NOT NULL DEFAULT 0,
    preco DECIMAL(15, 4) NOT NULL DEFAULT 0,
    qtd_por_embalagem VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Movimentações
CREATE TABLE IF NOT EXISTS movimentacoes (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'entrada' ou 'saida'
    quantidade DECIMAL(15, 4) NOT NULL,
    data TIMESTAMP NOT NULL,
    data_input DATE,
    quantidade_anterior DECIMAL(15, 4),
    quantidade_nova DECIMAL(15, 4),
    is_emprestimo BOOLEAN DEFAULT false,
    nome_emprestimo VARCHAR(255),
    qtd_por_embalagem VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
