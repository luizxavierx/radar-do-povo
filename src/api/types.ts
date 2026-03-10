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

export interface RankingConnection<T> {
  total: number;
  limit?: number;
  offset?: number;
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

export type CargoParlamentar = "DEPUTADO" | "SENADOR";

export interface RankingViagemFiltroInput {
  anoInicio?: number;
  anoFim?: number;
  orgaoSuperiorCodigo?: string;
  orgaoSolicitanteCodigo?: string;
  search?: string;
  situacao?: string;
  processoId?: string;
  pcdp?: string;
  cpfViajante?: string;
  nomeViajante?: string;
  cargo?: string;
  funcao?: string;
  destino?: string;
  motivo?: string;
  apenasParlamentares?: boolean;
  cargoParlamentar?: CargoParlamentar;
}

export interface ResumoViagens {
  totalViagens?: number;
  totalViajantes?: number;
  totalOrgaosSuperiores?: number;
  totalOrgaosSolicitantes?: number;
  totalTrechos?: number;
  totalDiariasCents?: string;
  totalPassagensCents?: string;
  totalPagamentosCents?: string;
  totalOutrosGastosCents?: string;
  totalDevolucaoCents?: string;
  totalGastoBrutoCents?: string;
  totalGastoLiquidoCents?: string;
  ticketMedioViagemCents?: string;
  gastoMedioViajanteCents?: string;
  periodo?: { anoInicio?: number; anoFim?: number };
}

// ─── Viagens ───
export interface Passagem {
  id?: string;
  processoId?: string;
  pcdp?: string;
  valorPassagemCents?: string;
  taxaServicoCents?: string;
  meioTransporte?: string;
  emissaoData?: string;
  emissaoHora?: string;
  idaOrigemPais?: string;
  idaOrigemUf?: string;
  idaOrigemCidade?: string;
  idaDestinoPais?: string;
  idaDestinoUf?: string;
  idaDestinoCidade?: string;
  voltaOrigemPais?: string;
  voltaOrigemUf?: string;
  voltaOrigemCidade?: string;
  voltaDestinoPais?: string;
  voltaDestinoUf?: string;
  voltaDestinoCidade?: string;
  ano?: number;
  importedAt?: string;
}

export interface Pagamento {
  id?: string;
  processoId?: string;
  pcdp?: string;
  orgaoSuperiorCodigo?: string;
  orgaoSuperiorNome?: string;
  orgaoPagadorCodigo?: string;
  tipoPagamento?: string;
  valorCents?: string;
  orgaoPagadorNome?: string;
  ugPagadoraCodigo?: string;
  ugPagadoraNome?: string;
  ano?: number;
  importedAt?: string;
}

export interface Trecho {
  id?: string;
  processoId?: string;
  pcdp?: string;
  sequencia?: number;
  origemData?: string;
  origemPais?: string;
  origemUf?: string;
  origemCidade?: string;
  destinoData?: string;
  destinoPais?: string;
  destinoUf?: string;
  destinoCidade?: string;
  meioTransporte?: string;
  numeroDiarias?: number;
  missao?: string;
  ano?: number;
  importedAt?: string;
}

export interface Viagem {
  processoId?: string;
  pcdp?: string;
  situacao?: string;
  viagemUrgente?: boolean;
  justificativaUrgencia?: string;
  orgaoSuperiorCodigo?: string;
  orgaoSuperiorNome?: string;
  orgaoSolicitanteCodigo?: string;
  orgaoSolicitanteNome?: string;
  cpfViajante?: string;
  dataInicio?: string;
  dataFim?: string;
  destinos?: string;
  nomeViajante?: string;
  cargo?: string;
  funcao?: string;
  descricaoFuncao?: string;
  motivo?: string;
  valorDiariasCents?: string;
  valorPassagensCents?: string;
  valorOutrosGastosCents?: string;
  valorDevolucaoCents?: string;
  ano?: number;
  importedAt?: string;
  passagens?: Connection<Passagem>;
  pagamentos?: Connection<Pagamento>;
  trechos?: Connection<Trecho>;
}

export interface ViagemPessoaRanking {
  cpfViajante?: string;
  nomeViajante?: string;
  cargo?: string;
  funcao?: string;
  descricaoFuncao?: string;
  totalViagens?: number;
  totalTrechos?: number;
  totalDiariasCents?: string;
  totalPassagensCents?: string;
  totalPagamentosCents?: string;
  totalOutrosGastosCents?: string;
  totalDevolucaoCents?: string;
  totalGastoBrutoCents?: string;
  totalGastoLiquidoCents?: string;
}

export interface ViagemOrgaoRanking {
  codigoOrgao?: string;
  nomeOrgao?: string;
  totalViagens?: number;
  totalViajantes?: number;
  totalTrechos?: number;
  totalDiariasCents?: string;
  totalPassagensCents?: string;
  totalPagamentosCents?: string;
  totalOutrosGastosCents?: string;
  totalDevolucaoCents?: string;
  totalGastoBrutoCents?: string;
  totalGastoLiquidoCents?: string;
}

export interface ViagemAnoRanking {
  nomeViajante?: string;
  cargo?: string;
  totalViagens?: number;
  totalPagamentosCents?: string;
  totalGastoLiquidoCents?: string;
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
  valorEmpenhadoCents?: string;
  valorLiquidadoCents?: string;
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
  cargoParlamentar?: CargoParlamentar;
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

export interface PoliticoDossieCompleto extends PoliticoResumo {
  perfilExterno?: PerfilExterno;
  gastos?: GastosAgregados;
  viagens?: Connection<Viagem>;
  emendas?: Connection<Emenda>;
}

export interface PoliticoFinanceiroResumo {
  gastos: GastosAgregados;
  emendasResumo: EmendasResumo;
}

export interface PerfilExternoFieldSelection {
  camara?: boolean;
  senado?: boolean;
  tse?: boolean;
  lexml?: boolean;
  brasilIo?: boolean;
  wikipedia?: boolean;
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
