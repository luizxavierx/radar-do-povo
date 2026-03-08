import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Crown,
  Filter,
  Globe,
  Landmark,
  Medal,
  SlidersHorizontal,
  Trophy,
  Users,
} from "lucide-react";

import AppSidebar from "@/components/AppSidebar";
import StatsCard from "@/components/StatsCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import {
  useTopDeputadosAno,
  useTopEmendasPorPaisAno,
  useTopGastadoresAno,
  useTopGastadoresCustom,
  useTopSenadoresAno,
} from "@/hooks/usePoliticos";
import { centsToNumber, formatCents, toBigInt } from "@/lib/formatters";
import type { RankingEmendaFiltroInput, TopEmendaPais, TopGastadorEmenda } from "@/api/types";

const PAGE_SIZE = 25;
const rankIcons = [Crown, Trophy, Medal];
const years = Array.from({ length: 8 }, (_, i) => 2026 - i);

type TabId = "geral" | "deputados" | "senadores" | "pais" | "custom";

const tabs: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: "geral", label: "Geral", icon: BarChart3 },
  { id: "deputados", label: "Deputados", icon: Users },
  { id: "senadores", label: "Senadores", icon: Landmark },
  { id: "pais", label: "Paises", icon: Globe },
  { id: "custom", label: "Custom", icon: SlidersHorizontal },
];

const RankingsPage = () => {
  const [activeTab, setActiveTab] = useState<TabId>("geral");
  const [ano, setAno] = useState(2025);
  const [offset, setOffset] = useState(0);

  const [anoInicio, setAnoInicio] = useState(2021);
  const [anoFim, setAnoFim] = useState(2025);
  const [uf, setUf] = useState("");
  const [pais, setPais] = useState("");
  const [tipoEmenda, setTipoEmenda] = useState("");
  const [apenasParlamentares, setApenasParlamentares] = useState(true);
  const [cargoParlamentar, setCargoParlamentar] = useState<"" | "DEPUTADO" | "SENADOR">("");

  const pagination = { limit: PAGE_SIZE, offset };

  const customFilter: RankingEmendaFiltroInput = useMemo(
    () => ({
      anoInicio,
      anoFim,
      uf: uf.trim().toUpperCase() || undefined,
      pais: pais.trim() || undefined,
      tipoEmenda: tipoEmenda.trim() || undefined,
      apenasParlamentares,
      cargoParlamentar: cargoParlamentar || undefined,
    }),
    [anoInicio, anoFim, uf, pais, tipoEmenda, apenasParlamentares, cargoParlamentar]
  );

  const geralQuery = useTopGastadoresAno(
    ano,
    activeTab === "geral" ? pagination : { limit: PAGE_SIZE, offset: 0 }
  );
  const depQuery = useTopDeputadosAno(
    ano,
    activeTab === "deputados" ? pagination : { limit: PAGE_SIZE, offset: 0 }
  );
  const senQuery = useTopSenadoresAno(
    ano,
    activeTab === "senadores" ? pagination : { limit: PAGE_SIZE, offset: 0 }
  );
  const paisQuery = useTopEmendasPorPaisAno(
    ano,
    activeTab === "pais" ? pagination : { limit: PAGE_SIZE, offset: 0 }
  );
  const customQuery = useTopGastadoresCustom(
    customFilter,
    activeTab === "custom" ? pagination : { limit: PAGE_SIZE, offset: 0 }
  );

  const activeQuery =
    activeTab === "geral"
      ? geralQuery
      : activeTab === "deputados"
      ? depQuery
      : activeTab === "senadores"
      ? senQuery
      : activeTab === "custom"
      ? customQuery
      : paisQuery;

  const topNodes =
    activeTab === "pais"
      ? []
      : (activeQuery.data?.nodes as TopGastadorEmenda[] | undefined) ?? [];

  const paisNodes =
    activeTab === "pais"
      ? (paisQuery.data?.nodes as TopEmendaPais[] | undefined) ?? []
      : [];

  const totalPagoCents = useMemo(() => {
    if (activeTab === "pais") {
      return paisNodes.reduce((acc, node) => acc + toBigInt(node.totalPagoCents), 0n);
    }
    return topNodes.reduce((acc, node) => acc + toBigInt(node.totalPagoCents), 0n);
  }, [activeTab, paisNodes, topNodes]);

  const mediaPago =
    activeTab === "pais"
      ? paisNodes.length
        ? formatCents((totalPagoCents / BigInt(paisNodes.length)).toString())
        : "R$ 0,00"
      : topNodes.length
      ? formatCents((totalPagoCents / BigInt(topNodes.length)).toString())
      : "R$ 0,00";

  const chartData = useMemo(() => {
    if (activeTab === "pais") {
      return paisNodes.slice(0, 8).map((node) => ({
        nome: node.pais.length > 18 ? `${node.pais.slice(0, 18)}...` : node.pais,
        valor: centsToNumber(node.totalPagoCents),
      }));
    }

    return topNodes.slice(0, 8).map((node) => ({
      nome: compactName(node.nomeAutorEmenda),
      valor: centsToNumber(node.totalPagoCents),
    }));
  }, [activeTab, paisNodes, topNodes]);

  const total = activeQuery.data?.total ?? 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = total ? Math.ceil(total / PAGE_SIZE) : 1;

  const handleTab = (tab: TabId) => {
    setActiveTab(tab);
    setOffset(0);
  };

  return (
    <div className="min-h-screen bg-grid-pattern">
      <AppSidebar />

      <main className="min-h-screen lg:ml-72">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-10 pt-16 sm:px-6 lg:pt-8">
          <section className="animate-fade-up rounded-3xl border border-white/60 bg-card/80 p-6 shadow-elevated backdrop-blur-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold">
                  Rankings de emendas <span className="text-gradient-primary">com filtros avancados</span>
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  Cruce ano, cargo, localidade e tipo de emenda para montar recortes especificos e validar concentracao de recursos.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold shadow-card">
                Ano
                <select
                  value={ano}
                  onChange={(e) => {
                    setAno(Number(e.target.value));
                    setOffset(0);
                  }}
                  className="bg-transparent outline-none"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "border-primary/30 bg-gradient-hero text-primary-foreground shadow-glow"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatsCard
              label="Total pago na pagina"
              value={formatCents(totalPagoCents.toString())}
              description="Soma do recorte atual"
              variant="green"
            />
            <StatsCard
              label="Registros totais"
              value={String(total)}
              description="Total retornado pela API"
              variant="blue"
            />
            <StatsCard
              label="Media por registro"
              value={mediaPago}
              description="Base visivel na pagina"
              variant="yellow"
            />
          </section>

          {activeTab === "custom" ? (
            <section className="mt-6 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-card">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
                <Filter className="h-4 w-4 text-primary" />
                Filtros da consulta custom
              </h2>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <label className="text-xs">
                  <span className="mb-1 block font-semibold text-muted-foreground">Ano inicio</span>
                  <select
                    value={anoInicio}
                    onChange={(e) => {
                      const nextStart = Number(e.target.value);
                      setAnoInicio(nextStart);
                      if (nextStart > anoFim) setAnoFim(nextStart);
                      setOffset(0);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-2 outline-none"
                  >
                    {years.map((year) => (
                      <option key={`start-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs">
                  <span className="mb-1 block font-semibold text-muted-foreground">Ano fim</span>
                  <select
                    value={anoFim}
                    onChange={(e) => {
                      const nextEnd = Number(e.target.value);
                      setAnoFim(nextEnd);
                      if (nextEnd < anoInicio) setAnoInicio(nextEnd);
                      setOffset(0);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-2 outline-none"
                  >
                    {years.map((year) => (
                      <option key={`end-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs">
                  <span className="mb-1 block font-semibold text-muted-foreground">UF</span>
                  <input
                    value={uf}
                    onChange={(e) => {
                      setUf(e.target.value.slice(0, 2));
                      setOffset(0);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-2 uppercase outline-none"
                    placeholder="SP"
                  />
                </label>

                <label className="text-xs">
                  <span className="mb-1 block font-semibold text-muted-foreground">Pais</span>
                  <input
                    value={pais}
                    onChange={(e) => {
                      setPais(e.target.value);
                      setOffset(0);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-2 outline-none"
                    placeholder="Brasil"
                  />
                </label>

                <label className="text-xs md:col-span-2">
                  <span className="mb-1 block font-semibold text-muted-foreground">Tipo de emenda</span>
                  <input
                    value={tipoEmenda}
                    onChange={(e) => {
                      setTipoEmenda(e.target.value);
                      setOffset(0);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-2 outline-none"
                    placeholder="PIX, bancada, individual..."
                  />
                </label>

                <label className="text-xs">
                  <span className="mb-1 block font-semibold text-muted-foreground">Cargo parlamentar</span>
                  <select
                    value={cargoParlamentar}
                    onChange={(e) => {
                      setCargoParlamentar(e.target.value as "" | "DEPUTADO" | "SENADOR");
                      setOffset(0);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-2 outline-none"
                  >
                    <option value="">Todos</option>
                    <option value="DEPUTADO">Deputado</option>
                    <option value="SENADOR">Senador</option>
                  </select>
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={apenasParlamentares}
                    onChange={(e) => {
                      setApenasParlamentares(e.target.checked);
                      setOffset(0);
                    }}
                    className="h-4 w-4"
                  />
                  Apenas parlamentares
                </label>
              </div>
            </section>
          ) : null}

          <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-3">
              {activeQuery.isLoading ? <LoadingState message="Carregando ranking..." /> : null}
              {activeQuery.error ? <ErrorState error={activeQuery.error as Error} /> : null}

              {!activeQuery.isLoading && !activeQuery.error && activeTab === "pais" && paisNodes.length === 0 ? (
                <EmptyState message="Nenhum pais encontrado no recorte atual." />
              ) : null}
              {!activeQuery.isLoading && !activeQuery.error && activeTab !== "pais" && topNodes.length === 0 ? (
                <EmptyState message="Nenhum parlamentar encontrado no recorte atual." />
              ) : null}

              {activeTab === "pais"
                ? paisNodes.map((node, index) => (
                    <PaisRow key={`${node.pais}-${offset + index}`} node={node} rank={offset + index + 1} />
                  ))
                : topNodes.map((node, index) => (
                    <ParlamentarRow
                      key={`${node.nomeAutorEmenda}-${offset + index}`}
                      node={node}
                      rank={offset + index + 1}
                    />
                  ))}
            </div>

            <aside className="space-y-4">
              <section className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-card">
                <h2 className="mb-3 text-sm font-bold">Leitura visual do top 8</h2>
                {chartData.length ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ top: 4, left: 8, right: 8, bottom: 4 }}>
                        <defs>
                          <linearGradient id="rankGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="hsl(182 89% 30%)" />
                            <stop offset="100%" stopColor="hsl(212 93% 47%)" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid horizontal={false} stroke="hsl(206 26% 82%)" strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          tickFormatter={(value) => `R$ ${(value / 1_000_000).toFixed(1)}M`}
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                        />
                        <YAxis type="category" dataKey="nome" tickLine={false} axisLine={false} width={104} fontSize={11} />
                        <RechartsTooltip
                          formatter={(value: number) =>
                            value.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                              maximumFractionDigits: 0,
                            })
                          }
                        />
                        <Bar dataKey="valor" fill="url(#rankGradient)" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="Sem dados para exibir grafico." />
                )}
              </section>

              <section className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-card">
                <h2 className="mb-3 text-sm font-bold">Resumo do painel</h2>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                    Aba ativa: <strong className="text-foreground">{tabs.find((tab) => tab.id === activeTab)?.label}</strong>
                  </li>
                  <li className="rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                    Ano principal: <strong className="text-foreground">{ano}</strong>
                  </li>
                  <li className="rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                    Total retornado: <strong className="text-foreground">{total}</strong>
                  </li>
                  {activeTab === "custom" ? (
                    <li className="rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                      Periodo custom: <strong className="text-foreground">{anoInicio} - {anoFim}</strong>
                    </li>
                  ) : null}
                </ul>
              </section>
            </aside>
          </section>

          {total > PAGE_SIZE ? (
            <section className="mt-6 flex items-center justify-center gap-3">
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

const ParlamentarRow = ({ node, rank }: { node: TopGastadorEmenda; rank: number }) => {
  const Icon = rank <= 3 ? rankIcons[rank - 1] : null;

  return (
    <article className="group rounded-2xl border border-border/80 bg-card/80 p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-soft text-primary">
          {Icon ? <Icon className="h-4.5 w-4.5" /> : <span className="text-xs font-bold">#{rank}</span>}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
            {node.nomeAutorEmenda}
          </h3>
          <p className="mt-1 text-[11px] text-muted-foreground">{node.totalEmendas ?? 0} emendas</p>
        </div>

        <div className="text-right">
          <p className="text-sm font-extrabold text-primary">{formatCents(node.totalPagoCents)}</p>
          <p className="text-[10px] text-muted-foreground">total pago</p>
        </div>
      </div>
    </article>
  );
};

const PaisRow = ({ node, rank }: { node: TopEmendaPais; rank: number }) => (
  <article className="group rounded-2xl border border-border/80 bg-card/80 p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-soft text-primary">
        <Globe className="h-4.5 w-4.5" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
          #{rank} {node.pais}
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">{node.totalEmendas ?? 0} emendas</p>
      </div>

      <div className="text-right">
        <p className="text-sm font-extrabold text-primary">{formatCents(node.totalPagoCents)}</p>
        <p className="text-[10px] text-muted-foreground">total pago</p>
      </div>
    </div>
  </article>
);

function compactName(value?: string): string {
  if (!value) return "-";
  return value
    .split(" ")
    .slice(0, 2)
    .join(" ")
    .slice(0, 18);
}

export default RankingsPage;
