import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, MapPin, Search, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import AppSidebar from "@/components/AppSidebar";
import SearchBar from "@/components/SearchBar";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import { usePoliticos } from "@/hooks/usePoliticos";
import { graphqlRequest } from "@/api/graphqlClient";
import { POLITICOS_LIST_QUERY } from "@/api/queries";
import type { Connection, PoliticoResumo } from "@/api/types";

const PAGE_SIZE = 24;

const cargoOptions = ["", "Deputado", "Senador", "Prefeito", "Vereador", "Governador"];

const BuscaPage = () => {
  const [search, setSearch] = useState("");
  const [partido, setPartido] = useState("");
  const [uf, setUf] = useState("");
  const [cargoAtual, setCargoAtual] = useState("");
  const [offset, setOffset] = useState(0);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const filter = useMemo(() => {
    const payload = {
      search: search.trim(),
      partido: partido.trim().toUpperCase(),
      uf: uf.trim().toUpperCase(),
      cargoAtual: cargoAtual.trim(),
    };

    if (!payload.search && !payload.partido && !payload.uf && !payload.cargoAtual) {
      return undefined;
    }

    return payload;
  }, [search, partido, uf, cargoAtual]);

  const { data, isLoading, error } = usePoliticos(filter, { limit: PAGE_SIZE, offset });

  const hasFilter = Boolean(filter);
  const total = data?.total ?? 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = total ? Math.ceil(total / PAGE_SIZE) : 1;

  useEffect(() => {
    if (!filter || !data) return;

    const nextOffset = offset + PAGE_SIZE;
    if (nextOffset >= data.total) return;

    queryClient.prefetchQuery({
      queryKey: ["politicos", filter, { limit: PAGE_SIZE, offset: nextOffset }],
      queryFn: ({ signal }) =>
        graphqlRequest<{ politicos: Connection<PoliticoResumo> }>(
          POLITICOS_LIST_QUERY,
          { filter, pagination: { limit: PAGE_SIZE, offset: nextOffset } },
          { signal }
        ).then((d) => d.politicos),
      staleTime: 60_000,
    });
  }, [data, filter, offset, queryClient]);

  const resetFilters = () => {
    setSearch("");
    setPartido("");
    setUf("");
    setCargoAtual("");
    setOffset(0);
  };

  return (
    <div className="min-h-screen bg-grid-pattern">
      <AppSidebar />

      <main className="min-h-screen lg:ml-72">
        <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <section className="animate-fade-up rounded-3xl border border-white/60 bg-card/85 p-7 shadow-elevated backdrop-blur-sm sm:p-8">
            <h1 className="text-3xl font-extrabold leading-tight">
              Busca inteligente de <span className="text-gradient-primary">politicos</span>
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Consulte por nome e refine por partido, UF e cargo para cruzar rapidamente os perfis retornados pela API.
            </p>

            <div className="mt-5">
              <SearchBar
                onSearch={(q) => {
                  setSearch(q);
                  setOffset(0);
                }}
                isLoading={isLoading}
                placeholder="Ex.: joao silva"
                defaultValue={search}
                submitLabel="Buscar"
                autoSearch
                debounceMs={300}
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
              <label className="rounded-xl border border-border bg-card p-3 text-xs shadow-card">
                <span className="mb-2 block font-semibold text-muted-foreground">Partido</span>
                <input
                  value={partido}
                  onChange={(e) => {
                    setPartido(e.target.value.slice(0, 10));
                    setOffset(0);
                  }}
                  placeholder="PL, PT, PSD..."
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs outline-none focus:border-primary/50"
                />
              </label>

              <label className="rounded-xl border border-border bg-card p-3 text-xs shadow-card">
                <span className="mb-2 block font-semibold text-muted-foreground">UF</span>
                <input
                  value={uf}
                  onChange={(e) => {
                    setUf(e.target.value.slice(0, 2));
                    setOffset(0);
                  }}
                  placeholder="SP, PR, BA..."
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs uppercase outline-none focus:border-primary/50"
                />
              </label>

              <label className="rounded-xl border border-border bg-card p-3 text-xs shadow-card">
                <span className="mb-2 block font-semibold text-muted-foreground">Cargo atual</span>
                <select
                  value={cargoAtual}
                  onChange={(e) => {
                    setCargoAtual(e.target.value);
                    setOffset(0);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs outline-none focus:border-primary/50"
                >
                  {cargoOptions.map((option) => (
                    <option key={option || "todos"} value={option}>
                      {option || "Todos"}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground shadow-card transition-colors hover:bg-muted"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Limpar filtros
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground">
                Filtros ativos: {hasFilter ? "sim" : "nao"}
              </span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-semibold text-primary">
                Resultado total: {total}
              </span>
            </div>
          </section>

          <section className="mt-8 space-y-3">
            {!hasFilter ? <EmptyState message="Use ao menos um filtro para iniciar a consulta." /> : null}
            {isLoading ? <LoadingState message="Consultando lista de politicos..." /> : null}
            {error ? <ErrorState error={error as Error} /> : null}
            {!isLoading && !error && hasFilter && data?.nodes.length === 0 ? (
              <EmptyState message="Nenhum politico encontrado com os filtros selecionados." />
            ) : null}

            {data?.nodes.map((politico) => (
              <button
                key={politico.id}
                onClick={() =>
                  navigate(`/politico/${encodeURIComponent(politico.nomeCanonico || politico.id)}`)
                }
                className="w-full text-left"
              >
                <PoliticianResultCard politico={politico} />
              </button>
            ))}
          </section>

          {total > PAGE_SIZE ? (
            <section className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={offset === 0}
                className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>

              <span className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                Pagina {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={offset + PAGE_SIZE >= total}
                className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Proxima
              </button>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
};

const PoliticianResultCard = ({ politico }: { politico: PoliticoResumo }) => (
  <article className="group rounded-2xl border border-border/75 bg-card/80 p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
    <div className="flex items-center gap-3">
      {politico.fotoUrl ? (
        <img src={politico.fotoUrl} alt={politico.nomeCanonico} className="h-12 w-12 rounded-xl object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold uppercase tracking-wide text-foreground group-hover:text-primary">
          {politico.nomeCompleto || politico.nomeCanonico}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
          {politico.partido ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">{politico.partido}</span>
          ) : null}
          {politico.uf ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-semibold text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />
              {politico.uf}
            </span>
          ) : null}
          {politico.cargoAtual ? (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 font-semibold text-accent">{politico.cargoAtual}</span>
          ) : null}
          {politico.dataNascimento ? (
            <span className="rounded-full bg-background px-2 py-0.5 font-semibold text-muted-foreground">
              nascimento informado
            </span>
          ) : null}
        </div>
      </div>

      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
        <Search className="h-3 w-3" />
        Ver perfil
      </span>
    </div>
  </article>
);

export default BuscaPage;
