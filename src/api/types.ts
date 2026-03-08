// ─── Pagination ───
export interface PaginationInput {
  limit?: number;
  offset?: number;
}

export interface Connection<T> {
  total: number;
  limit: number;
  offset: number;
  nodes: T[];
}

// ─── Politico (listagem leve) ───
export interface PoliticoResumo {
  id: string;
  nomeCanonico: string;
  nomeCompleto?: string;
  partido?: string;
  cargoAtual?: string;
  uf?: string;
  fotoUrl?: string;
  dataNascimento?: string;
}

// ─── Filtros de listagem ───
export interface PoliticoFilterInput {
  search?: string;
  partido?: string;
  uf?: string;
  cargoAtual?: string;
}

// ─── Gastos Agregados ───
export interface GastosAgregados {
  totalViagens?: number;
  totalTrechos?: number;
  totalDiariasCents?: string;
  totalPassagensCents?: string;
  totalPagamentosCents?: string;
  totalOutrosGastosCents?: string;
  totalDevolucaoCents?: string;
  periodo?: { anoInicio?: number; anoFim?: number };
}

// ─── Viagens ───
export interface Passagem {
  id?: string;
  valorPassagemCents?: string;
  emissaoData?: string;
}

export interface Pagamento {
  id?: string;
  tipoPagamento?: string;
  valorCents?: string;
}

export interface Trecho {
  id?: string;
  sequencia?: number;
  origemCidade?: string;
  destinoCidade?: string;
}

export interface Viagem {
  processoId?: string;
  dataInicio?: string;
  dataFim?: string;
  nomeViajante?: string;
  motivo?: string;
  valorDiariasCents?: string;
  valorPassagensCents?: string;
  passagens?: Connection<Passagem>;
  pagamentos?: Connection<Pagamento>;
  trechos?: Connection<Trecho>;
}

// ─── Emendas ───
export interface EmendaFiltroInput {
  anoInicio?: number;
  anoFim?: number;
  uf?: string;
  tipoEmenda?: string;
  pais?: string;
  apenasParlamentares?: boolean;
}

export interface Convenio {
  id?: string;
  numeroConvenio?: string;
  valorConvenioCents?: string;
}

export interface Favorecido {
  id?: string;
  favorecido?: string;
  valorRecebidoCents?: string;
}

export interface Emenda {
  id?: string;
  codigoEmenda?: string;
  anoEmenda?: number;
  tipoEmenda?: string;
  nomeAutorEmenda?: string;
  valorPagoCents?: string;
  convenios?: Connection<Convenio>;
  favorecidos?: Connection<Favorecido>;
}

export interface EmendasResumo {
  totalEmendas?: number;
  totalEmpenhadoCents?: string;
  totalLiquidadoCents?: string;
  totalPagoCents?: string;
  totalRecebidoFavorecidosCents?: string;
  totalFavorecidos?: number;
}

// ─── Rankings ───
export interface TopGastadorEmenda {
  codigoAutorEmenda?: string;
  nomeAutorEmenda: string;
  totalEmendas?: number;
  totalPagoCents: string;
  totalEmpenhadoCents?: string;
  totalLiquidadoCents?: string;
  totalRpInscritosCents?: string;
  totalRpCanceladosCents?: string;
  totalRpPagosCents?: string;
}

export interface TopEmendaPais {
  pais: string;
  totalEmendas?: number;
  totalPagoCents: string;
  totalEmpenhadoCents?: string;
  totalLiquidadoCents?: string;
}

export interface RankingEmendaFiltroInput {
  anoInicio?: number;
  anoFim?: number;
  uf?: string;
  tipoEmenda?: string;
  pais?: string;
  apenasParlamentares?: boolean;
  cargoParlamentar?: "DEPUTADO" | "SENADOR";
}

// ─── Perfil Externo ───
export interface PerfilExternoCamara {
  id?: string;
  nome?: string;
  siglaPartido?: string;
  siglaUf?: string;
  urlFoto?: string;
  email?: string;
  uri?: string;
  fonte?: string;
}

export interface PerfilExternoSenado {
  codigo?: string;
  nome?: string;
  nomeCompleto?: string;
  siglaPartido?: string;
  uf?: string;
  email?: string;
  urlFoto?: string;
  urlPagina?: string;
  afastadoAtual?: boolean;
  fonte?: string;
}

export interface PerfilExternoTSE {
  termoBusca?: string;
  datasetCandidatosUrl?: string;
  datasetResultadosUrl?: string;
  candidatosCdnBaseUrl?: string;
  divulgaCandContasUrl?: string;
  fonte?: string;
}

export interface PerfilExternoLexML {
  total?: number;
  documentos?: {
    titulo?: string;
    identificador?: string;
    tipo?: string;
    data?: string;
    url?: string;
    fonte?: string;
  }[];
}

export interface PerfilExternoBrasilIO {
  total?: number;
  candidatos?: {
    anoEleicao?: number;
    siglaUf?: string;
    nomeUrna?: string;
    nomeCompleto?: string;
    numeroCandidato?: number;
    siglaPartido?: string;
    descricaoCargo?: string;
    situacaoCandidatura?: string;
    fonte?: string;
  }[];
}

export interface PerfilExternoWikipedia {
  titulo?: string;
  resumo?: string;
  url?: string;
  fonte?: string;
}

export interface PerfilExterno {
  camara?: PerfilExternoCamara;
  senado?: PerfilExternoSenado;
  tse?: PerfilExternoTSE;
  lexml?: PerfilExternoLexML;
  brasilIo?: PerfilExternoBrasilIO;
  wikipedia?: PerfilExternoWikipedia;
}

// ─── Politico completo (detalhe) ───
export interface PoliticoDetalhe extends PoliticoResumo {
  perfilExterno?: PerfilExterno;
}

// ─── Health ───
export interface HealthStatus {
  status: string;
  db?: string;
  redis?: string;
  timestamp?: string;
}

// ─── GraphQL error shape ───
export interface GraphQLError {
  message: string;
  extensions?: {
    request_id?: string;
    [key: string]: unknown;
  };
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}
