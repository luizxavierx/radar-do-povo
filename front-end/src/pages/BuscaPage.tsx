import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, MapPin, Search, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";

import AppSidebar from "@/components/AppSidebar";
import EditorialPageHeader from "@/components/EditorialPageHeader";
import EditorialSection from "@/components/EditorialSection";
import MobileFiltersPanel from "@/components/MobileFiltersPanel";
import SeoHead from "@/components/SeoHead";
import SearchBar from "@/components/SearchBar";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import { normalizeConnection, usePoliticos } from "@/hooks/usePoliticos";
import { graphqlRequest } from "@/api/graphqlClient";
import { POLITICO_BASICO_QUERY, POLITICOS_LIST_QUERY } from "@/api/queries";
import { buildPoliticoPath } from "@/lib/politicos";
import { buildBreadcrumbStructuredData } from "@/lib/seo";
import { buildHoverLift, buildRevealVariants, buildStaggerVariants } from "@/lib/motion";
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
  const secondaryFilterCount = [partido, uf, cargoAtual].filter((value) => Boolean(value.trim())).length;
  const nodes = data?.nodes ?? [];
  const total = data?.total ?? 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = total ? Math.ceil(total / PAGE_SIZE) : 1;
  const seoDescription =
    "Busque políticos por nome, partido, UF ou cargo atual e acesse perfis consolidados com filtros institucionais.";
  const reduceMotion = useReducedMotion();

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
        ).then((d) => normalizeConnection<PoliticoResumo>(d.politicos)),
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

  const handleOpenPolitico = async (politico: PoliticoResumo) => {
    const baseLookup =
      politico.nomeCompleto?.trim() ||
      politico.nomeCanonico?.replace(/-/g, " ").trim() ||
      "";

    if (politico.nomeCompleto?.trim()) {
      navigate(
        buildPoliticoPath({
          nomeCompleto: politico.nomeCompleto,
          nomeCanonico: politico.nomeCanonico,
          id: politico.id,
        })
      );
      return;
    }

    try {
      const detalhe = await queryClient.fetchQuery({
        queryKey: ["politico-route-resolver", politico.id, politico.nomeCanonico],
        queryFn: ({ signal }) =>
          graphqlRequest<{ politico: Pick<PoliticoResumo, "id" | "nomeCanonico" | "nomeCompleto"> | null }>(
            POLITICO_BASICO_QUERY,
            { id: politico.id, nomeCanonico: politico.nomeCanonico },
            { signal, timeoutMs: 10_000 }
          ).then((data) => data.politico),
        staleTime: 30 * 60_000,
      });

      navigate(
        buildPoliticoPath({
          nomeCompleto: detalhe?.nomeCompleto || baseLookup,
          nomeCanonico: detalhe?.nomeCanonico || politico.nomeCanonico,
          id: detalhe?.id || politico.id,
        })
      );
    } catch {
      navigate(
        buildPoliticoPath({
          nomeCompleto: baseLookup,
          nomeCanonico: politico.nomeCanonico,
          id: politico.id,
        })
      );
    }
  };

  return (
    <div>
      <SeoHead
        title="Busca de políticos | Radar do Povo"
        description={seoDescription}
        path="/busca"
        keywords={[
          "buscar políticos",
          "perfil político",
          "políticos por partido",
          "políticos por uf",
          "radar do povo busca",
        ]}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Busca de políticos",
            description: seoDescription,
            url: "https://radardopovo.com/busca",
            inLanguage: "pt-BR",
            isPartOf: {
              "@type": "WebSite",
              name: "Radar do Povo",
              url: "https://radardopovo.com",
            },
          },
          buildBreadcrumbStructuredData([
            { name: "Home", path: "/" },
            { name: "Busca", path: "/busca" },
          ]),
        ]}
      />
      <AppSidebar />

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-[calc(var(--mobile-header-height)+env(safe-area-inset-top)+1rem)] sm:px-6 sm:pt-[calc(var(--mobile-header-height)+env(safe-area-inset-top)+1.25rem)] lg:pt-10">
          <EditorialPageHeader
            eyebrow="Busca editorial"
            icon={Search}
            reveal="mount"
            align="start"
            title={
              <>
                Busca de <span className="text-gradient-primary">políticos</span>
              </>
            }
            description="Encontre perfis por nome, partido, UF ou cargo atual, com uma leitura mais institucional e organizada."
            aside={
              <div className="hidden gap-3 md:grid">
                <SearchPageHeaderMetric
                  label="Recorte"
                  value={hasFilter ? "Filtrado" : "Aberto"}
                  helper={hasFilter ? "Busca ativa na base" : "Aguardando filtros"}
                />
              </div>
            }
            meta={
              hasFilter ? (
                <>
                  {search ? <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/60 px-3 py-1 text-[11px] font-bold text-primary shadow-sm backdrop-blur-md">Nome: {search}</span> : null}
                  {partido ? <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-3 py-1 text-[11px] font-bold text-muted-foreground shadow-sm backdrop-blur-md">Partido: {partido}</span> : null}
                  {uf ? <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-3 py-1 text-[11px] font-bold text-muted-foreground shadow-sm backdrop-blur-md">UF: {uf}</span> : null}
                  {cargoAtual ? <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-3 py-1 text-[11px] font-bold text-muted-foreground shadow-sm backdrop-blur-md">Cargo: {cargoAtual}</span> : null}
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-3 py-1 text-[11px] font-bold text-muted-foreground shadow-sm backdrop-blur-md">Use a busca e os filtros para iniciar</span>
              )
            }
          />

          <EditorialSection tone="strong" className="mt-6 rounded-[2rem] border border-white/50 bg-white/30 p-6 shadow-lg ring-1 ring-black/5 backdrop-blur-md sm:p-8" reveal="mount">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Consulta principal
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tighter text-foreground sm:text-[2rem]">Encontre perfis por nome ou partido</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                O campo principal conduz a busca, enquanto os filtros refinam a leitura sem poluir a página.
              </p>
            </div>

            <div className="mt-6 relative rounded-[1.5rem] bg-white/80 p-2 shadow-sm sm:p-4">
              <SearchBar
                onSearch={(q) => {
                  setSearch(q);
                  setOffset(0);
                }}
                isLoading={isLoading}
                placeholder="Ex.: joão silva"
                defaultValue={search}
                submitLabel="Buscar"
                autoSearch
                debounceMs={300}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/60 px-3.5 py-1.5 text-[11px] font-bold text-primary shadow-sm backdrop-blur-md">{formatCount(total)} resultados</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-3.5 py-1.5 text-[11px] font-bold text-muted-foreground shadow-sm backdrop-blur-md">{secondaryFilterCount} filtro(s) complementar(es)</span>
            </div>

            <MobileFiltersPanel
              className="mt-6"
              title="Filtros complementares"
              subtitle="Partido, UF e cargo atual"
              summary={secondaryFilterCount ? "Refino ativo" : "Refino opcional"}
              activeCount={secondaryFilterCount}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <label className="rounded-[1.25rem] border border-white/60 bg-white/50 px-4 py-3.5 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-colors hover:bg-white/80">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Partido
                  </span>
                  <input
                    value={partido}
                    onChange={(e) => {
                      setPartido(e.target.value.slice(0, 10));
                      setOffset(0);
                    }}
                    placeholder="PL, PT, PSD..."
                    className="w-full bg-transparent text-sm font-extrabold text-foreground outline-none placeholder:font-medium placeholder:text-muted-foreground/70"
                  />
                </label>

                <label className="rounded-[1.25rem] border border-white/60 bg-white/50 px-4 py-3.5 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-colors hover:bg-white/80">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    UF
                  </span>
                  <input
                    value={uf}
                    onChange={(e) => {
                      setUf(e.target.value.slice(0, 2));
                      setOffset(0);
                    }}
                    placeholder="SP, PR, BA..."
                    className="w-full bg-transparent text-sm font-extrabold uppercase text-foreground outline-none placeholder:font-medium placeholder:text-muted-foreground/70"
                  />
                </label>

                <label className="rounded-[1.25rem] border border-white/60 bg-white/50 px-4 py-3.5 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-colors hover:bg-white/80">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Cargo atual
                  </span>
                  <select
                    value={cargoAtual}
                    onChange={(e) => {
                      setCargoAtual(e.target.value);
                      setOffset(0);
                    }}
                    className="w-full cursor-pointer bg-transparent text-sm font-extrabold text-foreground outline-none"
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
                    className="touch-target inline-flex h-[68px] w-full items-center justify-center gap-2 rounded-[1.25rem] border border-white/80 bg-white/60 text-xs font-bold text-muted-foreground shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:bg-white/90 hover:text-primary hover:shadow-md"
                  >
                    <Filter className="h-4 w-4" />
                    Limpar filtros
                  </button>
                </div>
              </div>
            </MobileFiltersPanel>
          </EditorialSection>

          <motion.section
            initial={false}
            animate="visible"
            variants={buildStaggerVariants(Boolean(reduceMotion))}
            className="mt-8 space-y-4"
          >
            {!hasFilter ? <EmptyState message="Use ao menos um filtro para iniciar a consulta." /> : null}
            {isLoading ? <LoadingState message="Consultando lista de políticos..." /> : null}
            {error ? <ErrorState error={error as Error} /> : null}
            {!isLoading && !error && hasFilter && nodes.length === 0 ? (
              <EmptyState message="Nenhum político encontrado com os filtros selecionados." />
            ) : null}

            {nodes.map((politico) => (
              <motion.button
                key={politico.id}
                initial={false}
                animate="visible"
                variants={buildRevealVariants(Boolean(reduceMotion), { y: 12 })}
                whileHover={buildHoverLift(Boolean(reduceMotion), -2)}
                onClick={() => {
                  void handleOpenPolitico(politico);
                }}
                className="w-full text-left"
              >
                <PoliticianResultCard politico={politico} />
              </motion.button>
            ))}
          </motion.section>

          {total > PAGE_SIZE ? (
            <section className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={offset === 0}
                className="touch-target rounded-full border border-white/80 bg-white/60 px-5 py-2.5 text-xs font-bold text-muted-foreground shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:bg-white/90 hover:text-foreground hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>

              <span className="rounded-full border border-white/60 bg-white/40 px-4 py-2.5 text-xs font-bold text-foreground shadow-sm backdrop-blur-md">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={offset + PAGE_SIZE >= total}
                className="touch-target rounded-full border border-white/80 bg-white/60 px-5 py-2.5 text-xs font-bold text-muted-foreground shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:bg-white/90 hover:text-foreground hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
              </button>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
};

const PoliticianResultCard = ({ politico }: { politico: PoliticoResumo }) => (
  <article className="group overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/50 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/80 hover:shadow-xl">
    <div className="flex items-start gap-4">
      {politico.fotoUrl ? (
        <img src={politico.fotoUrl} alt={politico.nomeCanonico} className="h-14 w-14 rounded-[1.25rem] object-cover shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-white/80 shadow-sm ring-1 ring-black/5 transition-colors group-hover:bg-primary/5">
          <Users className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
      )}

      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="truncate text-base font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-lg">
          {politico.nomeCompleto || politico.nomeCanonico}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold">
          {politico.partido ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary shadow-sm">{politico.partido}</span>
          ) : null}
          {politico.uf ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2.5 py-1 text-slate-600 shadow-sm ring-1 ring-black/5">
              <MapPin className="h-3 w-3" />
              {politico.uf}
            </span>
          ) : null}
          {politico.cargoAtual ? (
            <span className="rounded-full bg-slate-100/80 px-2.5 py-1 text-slate-600 shadow-sm ring-1 ring-black/5">{politico.cargoAtual}</span>
          ) : null}
        </div>
      </div>

    </div>
    <div className="mt-4 flex justify-end">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-3.5 py-1.5 text-[11px] font-bold text-muted-foreground shadow-sm transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:border-primary">
        <Search className="h-3.5 w-3.5" />
        Ver perfil
      </span>
    </div>
  </article>
);

const SearchPageHeaderMetric = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) => (
  <div className="rounded-[1.25rem] border border-white/60 bg-white/40 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:bg-white/60 hover:shadow-md">
    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-2 text-lg font-extrabold tracking-tight text-foreground">{value}</p>
    <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{helper}</p>
  </div>
);

function formatCount(value: number) {
  return value > 0 ? value.toLocaleString("pt-BR") : "0";
}

export default BuscaPage;
