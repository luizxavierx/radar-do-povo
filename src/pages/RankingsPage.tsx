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
import { BarChart3, Crown, Globe, Landmark, Medal, Trophy, Users } from "lucide-react";

import AppSidebar from "@/components/AppSidebar";
import StatsCard from "@/components/StatsCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import {
  filtrarBancadas,
  useTopDeputadosAno,
  useTopGeralAno,
  useTopGastadoresAno,
  useTopSenadoresAno,
} from "@/hooks/useRankings";
import {
  centsToNumber,
  formatCents,
  formatCentsCompact,
  formatCountCompact,
  toBigInt,
} from "@/lib/formatters";
import type { TopGastadorEmenda } from "@/api/types";

const PAGE_SIZE = 10;
const rankIcons = [Crown, Trophy, Medal];
const years = Array.from({ length: 8 }, (_, i) => 2026 - i);

type TabId = "parlamentares" | "deputados" | "senadores" | "geral" | "bancadas";

const tabs: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: "parlamentares", label: "Top 30 Parlamentares", icon: BarChart3 },
  { id: "deputados", label: "Top 30 Deputados", icon: Users },
  { id: "senadores", label: "Top 30 Senadores", icon: Landmark },
  { id: "geral", label: "Geral (inclui bancadas)", icon: Globe },
  { id: "bancadas", label: "Bancadas filtradas", icon: Users },
];

const RankingsPage = () => {
  const [activeTab, setActiveTab] = useState<TabId>("parlamentares");
  const [ano, setAno] = useState(2025);
  const [offset, setOffset] = useState(0);

  const parlamentaresQuery = useTopGastadoresAno(ano);
  const deputadosQuery = useTopDeputadosAno(ano);
  const senadoresQuery = useTopSenadoresAno(ano);
  const geralQuery = useTopGeralAno(ano);

  const activeQuery =
    activeTab === "parlamentares"
      ? parlamentaresQuery
      : activeTab === "deputados"
      ? deputadosQuery
      : activeTab === "senadores"
      ? senadoresQuery
      : geralQuery;

  const rawNodes: TopGastadorEmenda[] =
    activeTab === "bancadas"
      ? filtrarBancadas((geralQuery.data?.nodes as TopGastadorEmenda[] | undefined) ?? [])
      : ((activeQuery.data?.nodes as TopGastadorEmenda[] | undefined) ?? []);

  const visibleNodes = useMemo(() => rawNodes.slice(offset, offset + PAGE_SIZE), [offset, rawNodes]);
  const totalRegistros = rawNodes.length;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = totalRegistros ? Math.ceil(totalRegistros / PAGE_SIZE) : 1;

  const totalPagoCents = useMemo(
    () => rawNodes.reduce((acc, node) => acc + toBigInt(node.totalPagoCents), 0n),
    [rawNodes]
  );

  const mediaPago =
    totalRegistros > 0 ? formatCents((totalPagoCents / BigInt(totalRegistros)).toString()) : "R$ 0,00";
  const mediaPagoCompact =
    totalRegistros > 0
      ? formatCentsCompact((totalPagoCents / BigInt(totalRegistros)).toString())
      : "R$ 0,00";

  const chartData = useMemo(
    () =>
      rawNodes.slice(0, 8).map((node) => ({
        nome: compactName(node.nomeAutorEmenda),
        valor: centsToNumber(node.totalPagoCents),
      })),
    [rawNodes]
  );

  const loading = activeQuery.isLoading;
  const error = activeQuery.error;

  return (
    <div>
      <AppSidebar />

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-14 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <section className="animate-fade-up rounded-3xl border border-white/60 bg-card/85 p-7 shadow-elevated backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold">
                  Rankings anuais <span className="text-gradient-primary">dos maiores volumes</span>
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  Recorte rapido dos principais autores por ano e por grupo.
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
                  onClick={() => {
                    setActiveTab(tab.id);
                    setOffset(0);
                  }}
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

          <section className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatsCard
              label="Total pago no recorte"
              value={formatCentsCompact(totalPagoCents.toString())}
              helper={formatCents(totalPagoCents.toString())}
              description={`Ano ${ano}`}
              variant="green"
            />
            <StatsCard
              label="Registros visiveis"
              value={formatCountCompact(totalRegistros)}
              helper={totalRegistros.toLocaleString("pt-BR")}
              description="Autores listados no recorte"
              variant="blue"
            />
            <StatsCard
              label="Media por registro"
              value={mediaPagoCompact}
              helper={mediaPago}
              description="Media por autor"
              variant="yellow"
            />
          </section>

          <section className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-3">
              {loading ? <LoadingState message="Carregando ranking..." /> : null}
              {error ? <ErrorState error={error as Error} /> : null}
              {!loading && !error && visibleNodes.length === 0 ? (
                <EmptyState message="Nenhum registro encontrado no recorte atual." />
              ) : null}

              {visibleNodes.map((node, index) => (
                <ParlamentarRow
                  key={`${node.codigoAutorEmenda || node.nomeAutorEmenda}-${offset + index}`}
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
            </aside>
          </section>

          {totalRegistros > PAGE_SIZE ? (
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
                disabled={offset + PAGE_SIZE >= totalRegistros}
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
          <p className="mt-1 text-[11px] text-muted-foreground">
            {(node.totalEmendas ?? 0).toLocaleString("pt-BR")} emendas
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-extrabold text-primary">{formatCentsCompact(node.totalPagoCents)}</p>
          <p className="text-[10px] text-muted-foreground">{formatCents(node.totalPagoCents)}</p>
        </div>
      </div>
    </article>
  );
};

function compactName(value?: string): string {
  if (!value) return "-";
  return value
    .split(" ")
    .slice(0, 2)
    .join(" ")
    .slice(0, 18);
}

export default RankingsPage;
