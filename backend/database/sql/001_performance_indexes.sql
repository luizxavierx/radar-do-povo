-- Execute em janela de manutencao.
-- As tabelas sao grandes, por isso usamos CONCURRENTLY para reduzir lock pesado.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_viagens_nome_ano_data_processo
ON public.viagens (nome_viajante, ano, data_inicio DESC, processo_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pagamentos_processo_ano
ON public.pagamentos (processo_id, ano);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trechos_processo_ano
ON public.trechos (processo_id, ano);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_passagens_processo_ano
ON public.passagens (processo_id, ano);

-- Consultas detalhadas por processo/ordenacao dos subcampos de viagens
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_passagens_processo_emissao_id
ON public.passagens (processo_id, emissao_data DESC, id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pagamentos_processo_ano_id
ON public.pagamentos (processo_id, ano DESC, id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trechos_processo_seq_id
ON public.trechos (processo_id, sequencia, id);

-- Consultas de emendas por autor e filtros de periodo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emendas_nome_autor_ano_pago
ON public.emendas (nome_autor_emenda, ano_emenda, valor_pago_cents DESC);

-- Ranking agregado de emendas (top gastadores) com filtros por ano/uf/tipo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emendas_ano_uf_tipo_autor_pago
ON public.emendas (ano_emenda, uf, tipo_emenda, nome_autor_emenda, valor_pago_cents DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emendas_convenios_cod_data
ON public.emendas_convenios (codigo_emenda, data_publicacao_convenio DESC, id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emendas_fav_nome_ano_mes
ON public.emendas_por_favorecido (nome_autor_emenda, ano_mes);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emendas_fav_cod_ano_mes_valor
ON public.emendas_por_favorecido (codigo_emenda, ano_mes DESC, valor_recebido_cents DESC, id);
