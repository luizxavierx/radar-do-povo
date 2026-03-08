import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  ArrowUpDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plane,
  Receipt,
  Route,
  Search,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import AppSidebar from "@/components/AppSidebar";
import SearchBar from "@/components/SearchBar";
import StatsCard from "@/components/StatsCard";
import {
  EmptyState,
  ErrorStateWithRetry,
  LoadingState,
} from "@/components/StateViews";
import { Skeleton } from "@/components/ui/skeleton";
import { GraphQLRequestError, graphqlRequest } from "@/api/graphqlClient";
import { VIAGENS_LISTA_QUERY, VIAGENS_RESUMO_QUERY } from "@/api/queries";
import type {
  Connection,
  GastosAgregados,
  PoliticoResumo,
  Viagem,
} from "@/api/types";
import { formatCents, formatDate, toBigInt } from "@/lib/formatters";
import {
  useDetalheViagem,
  useListaViagens,
  usePoliticoBusca,
  useResumoViagens,
} from "@/hooks/useViagens";

const PAGE_LIMIT = 10;
const years = Array.from({ length: 8 }, (_, i) => 2026 - i);

type SortKey = "data_desc" | "data_asc" | "valor_desc" | "valor_asc";

const travelSpotlight = [
  {
    key: "lula",
    search: "lula",
    nome: "Luiz Inacio Lula da Silva",
    foto:
      "https://upload.wikimedia.org/wikipedia/commons/8/86/Lula_-_foto_oficial_2023-01-09.jpg",
  },
  {
    key: "bolsonaro",
    search: "bolsonaro",
    nome: "Jair Messias Bolsonaro",
    foto:
      "https://upload.wikimedia.org/wikipedia/commons/9/93/Jair_Bolsonaro_2019_Portrait.jpg",
  },
  {
    key: "arthur-lira",
    search: "arthur lira",
    nome: "Arthur Lira",
    foto: "https://www.camara.leg.br/internet/deputado/bandep/160594.jpg",
  },
  {
    key: "davi-alcolumbre",
    search: "davi alcolumbre",
    nome: "Davi Alcolumbre",
    foto: "https://www.senado.leg.br/senadores/img/fotos-oficiais/senador5765.jpg",
  },
  {
    key: "simone-tebet",
    search: "simone tebet",
    nome: "Simone Tebet",
    foto:
      "https://upload.wikimedia.org/wikipedia/commons/8/89/Simone_Tebet_%28cropped%29.jpg",
  },
  {
    key: "flavio-dino",
    search: "flavio dino",
    nome: "Flavio Dino",
    foto:
      "https://upload.wikimedia.org/wikipedia/commons/0/0f/Flavio_Dino_%28cropped%29.jpg",
  },
];

function useErrorToast(error: unknown, scope: string) {
  const lastErrorRef = useRef<string>("");

  useEffect(() => {
    if (!error || !(error instanceof Error)) return;

    const requestId =
      error instanceof GraphQLRequestError ? error.requestId : undefined;
    const fingerprint = `${scope}|${error.message}|${requestId || "-"}`;
    if (lastErrorRef.current === fingerprint) return;

    lastErrorRef.current = fingerprint;

    const description = requestId
      ? `${error.message} (request_id: ${requestId})`
      : error.message;

    toast.error(scope, { description });
  }, [error, scope]);
}

const ViagensPage = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [searchInputSeed, setSearchInputSeed] = useState(initialSearch);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedPolitico, setSelectedPolitico] =
    useState<PoliticoResumo | null>(null);
  const [anoInicio, setAnoInicio] = useState(2024);
  const [anoFim, setAnoFim] = useState(2026);
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>("data_desc");
  const [expandedOffset, setExpandedOffset] = useState<number | null>(null);

  const searchQuery = usePoliticoBusca(searchTerm);
  const resumoQuery = useResumoViagens(selectedPolitico?.id, anoInicio, anoFim);
  const listaQuery = useListaViagens(selectedPolitico?.id, {
    anoInicio,
    anoFim,
    pagination: { limit: PAGE_LIMIT, offset },
  });
  const rankingCandidates = (searchQuery.data?.nodes || []).slice(0, 5);
  const rankingQueries = useQueries({
    queries: rankingCandidates.map((politico) => ({
      queryKey: ["ranking-viagens-resumo", politico.id, anoInicio, anoFim],
      queryFn: ({ signal }) =>
        graphqlRequest<{
          politico: (PoliticoResumo & { gastos?: GastosAgregados }) | null;
        }>(
          VIAGENS_RESUMO_QUERY,
          { id: politico.id, anoInicio, anoFim },
          { signal, timeoutMs: 12_000 }
        ).then((d) => ({
          politico,
          gastos: d.politico?.gastos,
        })),
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      enabled: rankingCandidates.length > 0,
    })),
  });

  useErrorToast(searchQuery.error, "Erro na busca de politicos");
  useErrorToast(resumoQuery.error, "Erro no resumo de viagens");
  useErrorToast(listaQuery.error, "Erro na lista de viagens");
  useErrorToast(
    rankingQueries.find((query) => query.error)?.error,
    "Erro no ranking de viagens da busca"
  );

  useEffect(() => {
    if (selectedPolitico || !searchQuery.data?.nodes?.length) return;
    setSelectedPolitico(searchQuery.data.nodes[0]);
  }, [searchQuery.data, selectedPolitico]);

  useEffect(() => {
    setOffset(0);
    setExpandedOffset(null);
  }, [selectedPolitico?.id, anoInicio, anoFim]);

  useEffect(() => {
    if (!selectedPolitico?.id || !listaQuery.data) return;

    const nextOffset = offset + PAGE_LIMIT;
    if (nextOffset >= listaQuery.data.total) return;

    const nextPagination = { limit: PAGE_LIMIT, offset: nextOffset };
    queryClient.prefetchQuery({
      queryKey: [
        "lista-viagens",
        selectedPolitico.id,
        anoInicio,
        anoFim,
        nextPagination,
      ],
      queryFn: ({ signal }) =>
        graphqlRequest<{ politico: { viagens?: Connection<Viagem> } | null }>(
          VIAGENS_LISTA_QUERY,
          {
            id: selectedPolitico.id,
            anoInicio,
            anoFim,
            limit: nextPagination.limit,
            offset: nextPagination.offset,
          },
          { signal, timeoutMs: 15_000 }
        ).then((d) => {
          if (d.politico?.viagens) return d.politico.viagens;
          return {
            total: 0,
            limit: nextPagination.limit,
            offset: nextPagination.offset,
            nodes: [],
          } as Connection<Viagem>;
        }),
      staleTime: 60_000,
    });
  }, [
    selectedPolitico?.id,
    listaQuery.data,
    offset,
    anoInicio,
    anoFim,
    queryClient,
  ]);

  const gastos = resumoQuery.data?.gastos;
  const totalViagens = listaQuery.data?.total ?? 0;
  const currentPage = Math.floor(offset / PAGE_LIMIT) + 1;
  const totalPages = totalViagens ? Math.ceil(totalViagens / PAGE_LIMIT) : 1;

  const totalInvestidoCents = useMemo(() => {
    if (!gastos) return 0n;
    const total =
      toBigInt(gastos.totalDiariasCents) +
      toBigInt(gastos.totalPassagensCents) +
      toBigInt(gastos.totalPagamentosCents) +
      toBigInt(gastos.totalOutrosGastosCents) -
      toBigInt(gastos.totalDevolucaoCents);
    return total > 0n ? total : 0n;
  }, [gastos]);

  const rows = useMemo(() => {
    const nodes = listaQuery.data?.nodes ?? [];

    const mapped = nodes.map((viagem, index) => {
      const rawTotal =
        toBigInt(viagem.valorDiariasCents) +
        toBigInt(viagem.valorPassagensCents) +
        toBigInt(viagem.valorOutrosGastosCents) -
        toBigInt(viagem.valorDevolucaoCents);

      return {
        viagem,
        serverOffset: offset + index,
        valorTotal: rawTotal > 0n ? rawTotal : 0n,
      };
    });

    mapped.sort((a, b) => {
      const aDate = a.viagem.dataInicio ? new Date(a.viagem.dataInicio).getTime() : 0;
      const bDate = b.viagem.dataInicio ? new Date(b.viagem.dataInicio).getTime() : 0;

      if (sortBy === "data_asc") return aDate - bDate;
      if (sortBy === "data_desc") return bDate - aDate;
      if (sortBy === "valor_asc") return a.valorTotal < b.valorTotal ? -1 : 1;
      return a.valorTotal > b.valorTotal ? -1 : 1;
    });

    return mapped;
  }, [listaQuery.data?.nodes, offset, sortBy]);

  const topViagensRanking = useMemo(() => {
    const items = rankingQueries
      .map((query) => query.data)
      .filter(
        (item): item is { politico: PoliticoResumo; gastos?: GastosAgregados } =>
          Boolean(item?.politico)
      );

    return items
      .map((item) => {
        const gastos = item?.gastos;
        const rawTotal =
          toBigInt(gastos?.totalDiariasCents) +
          toBigInt(gastos?.totalPassagensCents) +
          toBigInt(gastos?.totalPagamentosCents) +
          toBigInt(gastos?.totalOutrosGastosCents) -
          toBigInt(gastos?.totalDevolucaoCents);

        return {
          politico: item.politico,
          total: rawTotal > 0n ? rawTotal : 0n,
          totalViagens: gastos?.totalViagens ?? 0,
        };
      })
      .sort((a, b) => (a.total > b.total ? -1 : 1))
      .slice(0, 5);
  }, [rankingQueries]);

  return (
    <div className="min-h-screen bg-grid-pattern">
      <AppSidebar />

      <main className="min-h-screen lg:ml-72">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-14 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <section className="animate-fade-up rounded-3xl border border-white/70 bg-card/90 p-7 shadow-elevated backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <Plane className="h-3.5 w-3.5" />
                  Area de Viagens Oficiais
                </p>
                <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
                  Monitoramento de viagens{" "}
                  <span className="text-gradient-primary">com detalhe sob demanda</span>
                </h1>
                <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
                  Fluxo em blocos para performance real: perfil basico, resumo de gastos, lista paginada
                  e detalhe de passagens/pagamentos/trechos somente ao expandir a viagem.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-card">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Inicio
                  <select
                    value={anoInicio}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value > anoFim) return;
                      setAnoInicio(value);
                    }}
                    className="bg-transparent text-xs outline-none"
                  >
                    {years.map((year) => (
                      <option key={`start-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-card">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Fim
                  <select
                    value={anoFim}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value < anoInicio) return;
                      setAnoFim(value);
                    }}
                    className="bg-transparent text-xs outline-none"
                  >
                    {years.map((year) => (
                      <option key={`end-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="rounded-3xl border border-border/75 bg-card/85 p-5 shadow-card sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold sm:text-lg">Buscar politico</h2>
                <span className="text-[11px] text-muted-foreground">Debounce 300ms + cancelamento por signal</span>
              </div>

              <SearchBar
                onSearch={(value) => setSearchTerm(value)}
                isLoading={searchQuery.isLoading}
                placeholder="Digite nome do politico para carregar viagens"
                submitLabel="Pesquisar"
                autoSearch
                debounceMs={300}
                defaultValue={searchInputSeed}
              />

              <div className="mt-5">
                {searchTerm.trim().length < 2 ? (
                  <EmptyState message="Digite ao menos 2 caracteres para iniciar a busca." />
                ) : null}

                {searchQuery.isLoading && searchTerm.trim().length >= 2 ? (
                  <SearchSkeleton />
                ) : null}

                {searchQuery.error ? (
                  <ErrorStateWithRetry
                    error={searchQuery.error as Error}
                    onRetry={() => searchQuery.refetch()}
                  />
                ) : null}

                {!searchQuery.isLoading &&
                !searchQuery.error &&
                searchTerm.trim().length >= 2 &&
                !searchQuery.data?.nodes?.length ? (
                  <EmptyState message="Nenhum politico encontrado na busca atual." />
                ) : null}

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {searchQuery.data?.nodes?.map((politico) => {
                    const active = selectedPolitico?.id === politico.id;
                    const foto = politico.fotoUrl || buildAvatarUrl(politico.nomeCanonico);
                    return (
                      <button
                        key={politico.id}
                        onClick={() => setSelectedPolitico(politico)}
                        className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                          active
                            ? "border-primary/35 bg-primary/10 shadow-card"
                            : "border-border/75 bg-background/90 hover:border-primary/20 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={foto}
                            alt={politico.nomeCompleto || politico.nomeCanonico}
                            className="h-10 w-10 rounded-full border border-border object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold uppercase tracking-wide text-foreground">
                              {politico.nomeCompleto || politico.nomeCanonico}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {[politico.partido, politico.uf].filter(Boolean).join(" - ") || "Sem sigla"}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <section className="rounded-3xl border border-border/75 bg-card/85 p-5 shadow-card sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold sm:text-lg">Perfis populares</h2>
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Atalhos com foto para iniciar investigacao rapida de gastos com viagens.
              </p>
              <div className="space-y-2.5">
                {travelSpotlight.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setSearchInputSeed(item.search);
                      setSearchTerm(item.search);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-2xl border border-border/75 bg-background/90 px-3 py-2.5 text-left transition-all hover:border-primary/20 hover:bg-muted/30"
                  >
                    <img
                      src={item.foto}
                      alt={item.nome}
                      className="h-9 w-9 rounded-full border border-border object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold uppercase tracking-wide text-foreground">
                        {item.nome}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Abrir busca por nome</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </section>

          <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              label="Total investido em viagens"
              value={formatCents(totalInvestidoCents.toString())}
              description={`Periodo ${anoInicio}-${anoFim}`}
              icon={Wallet}
              variant="green"
            />
            <StatsCard
              label="Viagens no periodo"
              value={String(gastos?.totalViagens ?? totalViagens)}
              description="Contagem oficial da API"
              icon={Plane}
              variant="blue"
            />
            <StatsCard
              label="Trechos registrados"
              value={String(gastos?.totalTrechos ?? 0)}
              description="Total de deslocamentos"
              icon={Route}
              variant="yellow"
            />
            <StatsCard
              label="Passagens (total)"
              value={formatCents(gastos?.totalPassagensCents)}
              description="Soma em BRL"
              icon={Receipt}
              variant="blue"
            />
          </section>

          {topViagensRanking.length ? (
            <section className="mt-8 rounded-3xl border border-border/75 bg-card/85 p-5 shadow-card sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold sm:text-lg">Top gastos com viagens (busca atual)</h2>
                <span className="text-[11px] text-muted-foreground">Base: 5 primeiros da busca</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
                {topViagensRanking.map((item, index) => (
                  <button
                    key={item.politico.id}
                    onClick={() => setSelectedPolitico(item.politico)}
                    className="rounded-2xl border border-border/80 bg-background/90 px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
                  >
                    <div className="mb-2 inline-flex rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      #{index + 1}
                    </div>
                    <p className="truncate text-[11px] font-bold uppercase tracking-wide text-foreground">
                      {item.politico.nomeCompleto || item.politico.nomeCanonico}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {item.totalViagens.toLocaleString("pt-BR")} viagens
                    </p>
                    <p className="mt-2 text-xs font-bold text-primary">
                      {formatCents(item.total.toString())}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-8 rounded-3xl border border-border/75 bg-card/85 p-5 shadow-card sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold sm:text-lg">Lista de viagens oficiais</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Paginacao server-side (limit 10) com ordenacao local da pagina atual.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold">
                <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
                Ordenacao
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="bg-transparent outline-none"
                >
                  <option value="data_desc">Data (mais recente)</option>
                  <option value="data_asc">Data (mais antiga)</option>
                  <option value="valor_desc">Valor (maior)</option>
                  <option value="valor_asc">Valor (menor)</option>
                </select>
              </label>
            </div>

            {!selectedPolitico ? (
              <EmptyState message="Selecione um politico para carregar a area de viagens." />
            ) : null}

            {selectedPolitico && resumoQuery.isLoading ? (
              <div className="mb-4">
                <LoadingState message="Carregando resumo de gastos..." />
              </div>
            ) : null}

            {selectedPolitico && resumoQuery.error ? (
              <div className="mb-4">
                <ErrorStateWithRetry
                  error={resumoQuery.error as Error}
                  onRetry={() => resumoQuery.refetch()}
                />
              </div>
            ) : null}

            {selectedPolitico && listaQuery.isLoading ? (
              <ViagensSkeleton />
            ) : null}

            {selectedPolitico && listaQuery.error ? (
              <ErrorStateWithRetry
                error={listaQuery.error as Error}
                onRetry={() => listaQuery.refetch()}
              />
            ) : null}

            {selectedPolitico &&
            !listaQuery.isLoading &&
            !listaQuery.error &&
            (listaQuery.data?.total ?? 0) === 0 ? (
              <EmptyState message="Nenhuma viagem encontrada para esse politico no periodo filtrado." />
            ) : null}

            {selectedPolitico &&
            !listaQuery.isLoading &&
            !listaQuery.error &&
            rows.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-xs">
                    <thead>
                      <tr className="border-b border-border/80 text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-semibold">Periodo</th>
                        <th className="pb-2 pr-4 font-semibold">Viajante</th>
                        <th className="pb-2 pr-4 font-semibold">Orgao solicitante</th>
                        <th className="pb-2 pr-4 font-semibold">Motivo</th>
                        <th className="pb-2 pr-4 text-right font-semibold">Total da viagem</th>
                        <th className="pb-2 text-right font-semibold">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {rows.map(({ viagem, serverOffset, valorTotal }) => (
                        <ViagemRow
                          key={viagem.processoId || serverOffset}
                          viagem={viagem}
                          serverOffset={serverOffset}
                          valorTotal={valorTotal}
                          expanded={expandedOffset === serverOffset}
                          onToggle={() =>
                            setExpandedOffset((current) =>
                              current === serverOffset ? null : serverOffset
                            )
                          }
                          politicoId={selectedPolitico.id}
                          anoInicio={anoInicio}
                          anoFim={anoFim}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalViagens > PAGE_LIMIT ? (
                  <section className="mt-6 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setOffset(Math.max(0, offset - PAGE_LIMIT))}
                      disabled={offset === 0}
                      className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Anterior
                    </button>
                    <span className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                      Pagina {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setOffset(offset + PAGE_LIMIT)}
                      disabled={offset + PAGE_LIMIT >= totalViagens}
                      className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Proxima
                    </button>
                  </section>
                ) : null}
              </>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
};

const ViagemRow = ({
  viagem,
  serverOffset,
  valorTotal,
  expanded,
  onToggle,
  politicoId,
  anoInicio,
  anoFim,
}: {
  viagem: Viagem;
  serverOffset: number;
  valorTotal: bigint;
  expanded: boolean;
  onToggle: () => void;
  politicoId: string;
  anoInicio: number;
  anoFim: number;
}) => (
  <>
    <tr className="hover:bg-muted/30">
      <td className="py-2.5 pr-4 text-muted-foreground">
        {formatDate(viagem.dataInicio)} - {formatDate(viagem.dataFim)}
      </td>
      <td className="py-2.5 pr-4 text-foreground">
        <p className="font-semibold">{viagem.nomeViajante || "-"}</p>
        <p className="text-[11px] text-muted-foreground">{viagem.cargo || "-"}</p>
      </td>
      <td className="max-w-[220px] truncate py-2.5 pr-4 text-muted-foreground">
        {viagem.orgaoSolicitanteNome || "-"}
      </td>
      <td className="max-w-[300px] truncate py-2.5 pr-4 text-muted-foreground">
        {viagem.motivo || "-"}
      </td>
      <td className="py-2.5 pr-4 text-right font-bold text-primary">
        {formatCents(valorTotal.toString())}
      </td>
      <td className="py-2.5 text-right">
        <button
          onClick={onToggle}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted"
        >
          {expanded ? (
            <>
              Fechar <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Ver detalhes <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </td>
    </tr>
    {expanded ? (
      <tr className="bg-muted/20">
        <td className="px-3 py-3" colSpan={6}>
          <ViagemDetalheExpanded
            politicoId={politicoId}
            anoInicio={anoInicio}
            anoFim={anoFim}
            offsetViagens={serverOffset}
          />
        </td>
      </tr>
    ) : null}
  </>
);

const ViagemDetalheExpanded = ({
  politicoId,
  anoInicio,
  anoFim,
  offsetViagens,
}: {
  politicoId: string;
  anoInicio: number;
  anoFim: number;
  offsetViagens: number;
}) => {
  const detalheQuery = useDetalheViagem(politicoId, {
    anoInicio,
    anoFim,
    offsetViagens,
    enabled: true,
  });

  useErrorToast(detalheQuery.error, "Erro ao carregar detalhe da viagem");

  if (detalheQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (detalheQuery.error) {
    return (
      <ErrorStateWithRetry
        error={detalheQuery.error as Error}
        onRetry={() => detalheQuery.refetch()}
      />
    );
  }

  const viagem = detalheQuery.data;
  if (!viagem) {
    return <EmptyState message="Nao foi possivel carregar os detalhes desta viagem." />;
  }

  const passagens = viagem.passagens?.nodes || [];
  const pagamentos = viagem.pagamentos?.nodes || [];
  const trechos = viagem.trechos?.nodes || [];

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <DetailCard
        title={`Passagens (${viagem.passagens?.total ?? passagens.length})`}
        rows={passagens.map((item) => ({
          primary: `${item.meioTransporte || "Transporte"} - ${formatCents(
            item.valorPassagemCents
          )}`,
          secondary: `${item.idaOrigemCidade || "-"} -> ${item.idaDestinoCidade || "-"}`,
        }))}
        emptyMessage="Sem passagens neste recorte."
      />
      <DetailCard
        title={`Pagamentos (${viagem.pagamentos?.total ?? pagamentos.length})`}
        rows={pagamentos.map((item) => ({
          primary: `${item.tipoPagamento || "Pagamento"} - ${formatCents(item.valorCents)}`,
          secondary: item.orgaoPagadorNome || "-",
        }))}
        emptyMessage="Sem pagamentos neste recorte."
      />
      <DetailCard
        title={`Trechos (${viagem.trechos?.total ?? trechos.length})`}
        rows={trechos.map((item) => ({
          primary: `${item.origemCidade || "-"} -> ${item.destinoCidade || "-"}`,
          secondary: `${item.meioTransporte || "Nao informado"} | ${item.numeroDiarias || 0} diarias`,
        }))}
        emptyMessage="Sem trechos neste recorte."
      />
    </div>
  );
};

const DetailCard = ({
  title,
  rows,
  emptyMessage,
}: {
  title: string;
  rows: { primary: string; secondary: string }[];
  emptyMessage: string;
}) => (
  <article className="rounded-2xl border border-border/75 bg-card/80 p-3">
    <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
      {title}
    </h4>
    {!rows.length ? (
      <p className="text-xs text-muted-foreground">{emptyMessage}</p>
    ) : (
      <div className="space-y-1.5">
        {rows.map((row, index) => (
          <div key={index} className="rounded-xl border border-border/70 bg-background/90 px-2.5 py-2">
            <p className="truncate text-[11px] font-semibold text-foreground">{row.primary}</p>
            <p className="truncate text-[10px] text-muted-foreground">{row.secondary}</p>
          </div>
        ))}
      </div>
    )}
  </article>
);

const SearchSkeleton = () => (
  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="rounded-2xl border border-border/75 bg-background/90 px-3 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ViagensSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <Skeleton key={index} className="h-14 w-full rounded-xl" />
    ))}
  </div>
);

function buildAvatarUrl(value: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    value
  )}&background=e7f6f6&color=0f766e&size=128&format=png`;
}

export default ViagensPage;
