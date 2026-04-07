import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  Globe,
  GraduationCap,
  Landmark,
  Link as LinkIcon,
  Mail,
  MapPin,
  Plane,
  Phone,
  FileText,
  Scale,
  User,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { motion, useReducedMotion } from "framer-motion";

import AppSidebar from "@/components/AppSidebar";
import PaginationControls from "@/components/PaginationControls";
import SeoHead from "@/components/SeoHead";
import ShareActions from "@/components/ShareActions";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { PoliticoNewsSection } from "@/components/politicos/PoliticoNewsSection";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePoliticoDossieCompleto,
  usePoliticoNoticias,
} from "@/hooks/usePoliticos";
import {
  centsToNumber,
  formatCents,
  formatCentsCompact,
  formatCountCompact,
  formatDate,
  toBigInt,
} from "@/lib/formatters";
import { buildRevealVariants, buildStaggerVariants } from "@/lib/motion";
import { buildPoliticoPath, getPoliticoLookupValue } from "@/lib/politicos";
import { buildBreadcrumbStructuredData, truncateSeoDescription } from "@/lib/seo";
import type { Emenda, PerfilExterno, Viagem } from "@/api/types";

const PAGE_SIZE = 10;
const LEXML_PAGE_SIZE = 10;
const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_END_YEAR = Math.max(2019, CURRENT_YEAR - 1);
const years = Array.from({ length: Math.max(CURRENT_YEAR - 2018, 1) }, (_, i) => CURRENT_YEAR - i);
const pieColors = ["#0f766e", "#2563eb", "#f59e0b", "#ef4444"];

const PoliticoDetalhe = () => {
  const reduceMotion = useReducedMotion();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [anoInicio, setAnoInicio] = useState(2019);
  const [anoFim, setAnoFim] = useState(DEFAULT_END_YEAR);
  const [viagensOffset, setViagensOffset] = useState(0);
  const [emendasOffset, setEmendasOffset] = useState(0);
  const [lexmlOffset, setLexmlOffset] = useState(0);

  const routeLookup = decodeURIComponent(id || "").trim();
  const nomeBusca = getPoliticoLookupValue(routeLookup);
  const { data: politico, isLoading, error } = usePoliticoDossieCompleto(nomeBusca, {
    anoInicio,
    anoFim,
    viagensLimit: PAGE_SIZE,
    viagensOffset,
    emendasLimit: PAGE_SIZE,
    emendasOffset,
    lexmlLimit: LEXML_PAGE_SIZE,
    lexmlOffset,
    passagensLimit: 12,
    pagamentosLimit: 12,
    trechosLimit: 12,
    conveniosLimit: 12,
    favorecidosLimit: 12,
    includePerfilExterno: false,
    includePassagens: false,
    includePagamentos: false,
    includeTrechos: true,
    includeConvenios: false,
    includeFavorecidos: false,
  });
  const { data: politicoPerfilExterno, isLoading: isPerfilExternoLoading } = usePoliticoDossieCompleto(
    politico ? nomeBusca : undefined,
    {
      lexmlLimit: LEXML_PAGE_SIZE,
      lexmlOffset,
      includePerfilExterno: true,
      includeGastos: false,
      includeEmendasResumo: false,
      includeViagens: false,
      includeEmendas: false,
      includePassagens: false,
      includePagamentos: false,
      includeTrechos: false,
      includeConvenios: false,
      includeFavorecidos: false,
      includeTse: true,
    }
  );
  const nomePoliticoNoticias = politico
    ? politico.nomeCompleto || politico.nomeCanonico?.replace(/-/g, " ") || nomeBusca.replace(/-/g, " ")
    : "";
  const {
    data: noticias,
    isLoading: isNoticiasLoading,
    error: noticiasError,
    refetch: refetchNoticias,
  } = usePoliticoNoticias(nomePoliticoNoticias, 6);

  useEffect(() => {
    setLexmlOffset(0);
  }, [nomeBusca]);

  useEffect(() => {
    if (!routeLookup) {
      return;
    }

    const canonicalPath = buildPoliticoPath(routeLookup);
    if (canonicalPath !== location.pathname) {
      navigate(canonicalPath, { replace: true });
    }
  }, [location.pathname, navigate, routeLookup]);

  const gastos = politico?.gastos;
  const totalDiariasCents = toBigInt(gastos?.totalDiariasCents);
  const totalPassagensCents = toBigInt(gastos?.totalPassagensCents);
  const totalOutrosGastosCents = toBigInt(gastos?.totalOutrosGastosCents);
  const totalDevolucaoCents = toBigInt(gastos?.totalDevolucaoCents);
  const totalPagamentosCents = toBigInt(gastos?.totalPagamentosCents);
  const totalGastoBrutoCents =
    totalDiariasCents + totalPassagensCents + totalOutrosGastosCents;
  const totalGastoLiquidoCents = totalGastoBrutoCents - totalDevolucaoCents;

  const viagensNodes = politico?.viagens?.nodes ?? [];
  const viagensTotalApi = politico?.viagens?.total ?? viagensNodes.length;
  const viagensTotalView = viagensTotalApi;
  const viagensPage = viagensNodes;

  const emendasNodes = politico?.emendas?.nodes ?? [];
  const emendasTotalApi = politico?.emendas?.total ?? emendasNodes.length;
  const emendasTotalView = emendasTotalApi;
  const emendasPage = emendasNodes;

  const emendasResumo = useMemo(
    () => politico?.emendasResumo ?? buildEmendasResumo(emendasNodes),
    [emendasNodes, politico?.emendasResumo]
  );

  const perfilExterno = politicoPerfilExterno?.perfilExterno ?? politico?.perfilExterno;

  const fotoUrl =
    politico?.fotoUrl ||
    perfilExterno?.camara?.urlFoto ||
    perfilExterno?.senado?.urlFoto;
  const politicoDisplayName =
    politico?.nomeCompleto ||
    politico?.nomeCanonico ||
    nomeBusca.replace(/-/g, " ");
  const politicoShareUrl =
    typeof window !== "undefined" ? window.location.href : "";
  const politicoCanonicalPath = buildPoliticoPath({
    nomeCompleto: politico?.nomeCompleto || politicoDisplayName || routeLookup,
    nomeCanonico: politico?.nomeCanonico,
    id: politico?.id,
  });
  const politicoSeoDescription = truncateSeoDescription(
    perfilExterno?.wikipedia?.resumo ||
      `Veja o perfil completo de ${politicoDisplayName}, com viagens oficiais, emendas parlamentares e referências externas organizadas pelo Radar do Povo.`
  );
  const politicoSameAs = [
    perfilExterno?.wikipedia?.url,
    perfilExterno?.camara?.uri,
    perfilExterno?.senado?.urlPagina,
    perfilExterno?.tse?.divulgaCandContasUrl,
  ].filter((value): value is string => Boolean(value));
  const politicoStructuredData = [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      name: `${politicoDisplayName} | Radar do Povo`,
      description: politicoSeoDescription,
      url: `https://radardopovo.com${politicoCanonicalPath}`,
      inLanguage: "pt-BR",
      isPartOf: {
        "@type": "WebSite",
        name: "Radar do Povo",
        url: "https://radardopovo.com",
      },
      mainEntity: {
        "@type": "Person",
        name: politicoDisplayName,
        description: politicoSeoDescription,
        image: fotoUrl || "https://radardopovo.com/logo.png",
        jobTitle: politico?.cargoAtual,
        affiliation: politico?.partido
          ? {
              "@type": "Organization",
              name: politico.partido,
            }
          : undefined,
        sameAs: politicoSameAs.length ? politicoSameAs : undefined,
      },
    },
    buildBreadcrumbStructuredData([
      { name: "Home", path: "/" },
      { name: "Busca", path: "/busca" },
      { name: politicoDisplayName, path: politicoCanonicalPath },
    ]),
  ];

  const pieData = useMemo(() => {
    if (!gastos) return [];

    const source = [
      { name: "Diárias", value: centsToNumber(totalDiariasCents.toString()) },
      { name: "Passagens", value: centsToNumber(totalPassagensCents.toString()) },
      { name: "Outros", value: centsToNumber(totalOutrosGastosCents.toString()) },
    ];
    const filtered = source.filter((item) => item.value > 0);
    const total = filtered.reduce((acc, item) => acc + item.value, 0);

    return filtered.map((item, index) => ({
      ...item,
      color: pieColors[index % pieColors.length],
      share: total > 0 ? (item.value / total) * 100 : 0,
    }));
  }, [gastos, totalDiariasCents, totalOutrosGastosCents, totalPassagensCents]);

  const totalGastos = useMemo(() => {
    if (!gastos) return "R$ 0,00";

    return formatCents(totalGastoLiquidoCents.toString());
  }, [gastos, totalGastoLiquidoCents]);

  const handlePeriodChange = (start: number, end: number) => {
    if (start > end) return;
    setAnoInicio(start);
    setAnoFim(end);
    setViagensOffset(0);
    setEmendasOffset(0);
  };

  return (
    <div className="min-h-screen bg-grid-pattern">
      <SeoHead
        title={`${politicoDisplayName} | Perfil político no Radar do Povo`}
        description={politicoSeoDescription}
        path={politicoCanonicalPath}
        image={fotoUrl || "/logo.png"}
        imageAlt={politicoDisplayName}
        type="profile"
        robots={!isLoading && (!politico || Boolean(error)) ? "noindex,nofollow" : undefined}
        keywords={[
          politicoDisplayName,
          "perfil político",
          "viagens oficiais",
          "emendas parlamentares",
          "radar do povo",
        ]}
        structuredData={politicoStructuredData}
      />
      <AppSidebar />

      <main className="min-h-screen lg:ml-72">
        <div className="mx-auto w-full max-w-[1180px] px-4 pb-14 pt-[calc(var(--mobile-header-height)+env(safe-area-inset-top)+1rem)] sm:px-6 sm:pt-[calc(var(--mobile-header-height)+env(safe-area-inset-top)+1.25rem)] lg:pt-10">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-xs font-bold text-muted-foreground shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:bg-white/90 hover:text-foreground hover:shadow-md"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </button>

          {isLoading ? <DossieSkeleton /> : null}
          {error ? <ErrorState error={error as Error} /> : null}
          {!isLoading && !error && !politico ? (
            <EmptyState message={`Nenhum dossiê encontrado para "${nomeBusca}".`} />
          ) : null}

          {politico ? (
            <div className="space-y-6">
              <motion.section
                initial="hidden"
                animate="visible"
                variants={buildRevealVariants(Boolean(reduceMotion))}
                className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-xl sm:p-8"
              >
                {/* Glow effects behind profile */}
                <div className="absolute -left-10 -top-10 h-64 w-64 pointer-events-none rounded-full bg-primary/10 blur-[60px]" />

                <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-start">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt={politico.nomeCanonico}
                        className="h-28 w-28 rounded-[1.5rem] object-cover shadow-lg ring-1 ring-black/5 transition-transform duration-500 hover:scale-105 sm:h-32 sm:w-32"
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-[1.5rem] bg-white/80 shadow-inner ring-1 ring-black/5 sm:h-32 sm:w-32">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-primary shadow-sm backdrop-blur-md">
                        <User className="h-3.5 w-3.5" />
                        Perfil completo
                      </p>
                      <h1 className="text-3xl font-extrabold leading-tight tracking-tighter text-foreground drop-shadow-sm sm:text-4xl">
                        {politico.nomeCompleto || politico.nomeCanonico}
                      </h1>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                        {politico.partido ? (
                          <span className="rounded-full bg-primary/10 px-3 py-1.5 text-primary shadow-sm">
                            {politico.partido}
                          </span>
                        ) : null}
                        {politico.uf ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-slate-600 shadow-sm ring-1 ring-black/5">
                            <MapPin className="h-3 w-3" />
                            {politico.uf}
                          </span>
                        ) : null}
                        {politico.cargoAtual ? (
                          <span className="rounded-full bg-white/80 px-3 py-1.5 text-slate-600 shadow-sm ring-1 ring-black/5">
                            {politico.cargoAtual}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-5 max-w-3xl text-sm font-medium leading-relaxed text-muted-foreground">
                        Dossiê consolidado de viagens oficiais, emendas parlamentares e referências externas no recorte de{" "}
                        <strong className="font-extrabold text-foreground">
                          {anoInicio} a {anoFim}
                        </strong>.
                      </p>

                      <ShareActions
                        label="Compartilhar perfil"
                        title={`${politicoDisplayName} | Radar do Povo`}
                        text={`Veja o perfil completo de ${politicoDisplayName} no Radar do Povo, com viagens e emendas no recorte de ${anoInicio} a ${anoFim}.`}
                        url={politicoShareUrl}
                        className="mt-5"
                      />

                      <div className="mt-5 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
                        {politico.dataNascimento ? (
                          <span>Nascimento: <strong className="text-foreground">{formatDate(politico.dataNascimento)}</strong></span>
                        ) : null}
                        {perfilExterno?.camara?.email ||
                        perfilExterno?.senado?.email ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-primary" />
                            <strong className="text-foreground">{perfilExterno?.camara?.email || perfilExterno?.senado?.email}</strong>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/60 bg-white/50 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      Recorte do dossiê
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-foreground">
                      {anoInicio} a {anoFim}
                    </p>
                    <p className="mt-1.5 text-xs font-medium leading-relaxed text-muted-foreground">
                      Ajuste o período para recalcular viagens e emendas do perfil.
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                      <label className="rounded-[1rem] border border-white/80 bg-white/80 px-3 py-2.5 shadow-sm ring-1 ring-black/5 transition-colors focus-within:border-primary/40 focus-within:ring-primary/20">
                        <span className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          Início
                        </span>
                        <select
                          value={anoInicio}
                          onChange={(e) => handlePeriodChange(Number(e.target.value), anoFim)}
                          className="w-full cursor-pointer bg-transparent text-sm font-extrabold outline-none"
                        >
                          {years.map((year) => (
                            <option key={`start-${year}`} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="rounded-[1rem] border border-white/80 bg-white/80 px-3 py-2.5 shadow-sm ring-1 ring-black/5 transition-colors focus-within:border-primary/40 focus-within:ring-primary/20">
                        <span className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          Fim
                        </span>
                        <select
                          value={anoFim}
                          onChange={(e) => handlePeriodChange(anoInicio, Number(e.target.value))}
                          className="w-full cursor-pointer bg-transparent text-sm font-extrabold outline-none"
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
                </div>
              </motion.section>

              <motion.section
                initial="hidden"
                animate="visible"
                variants={buildStaggerVariants(Boolean(reduceMotion))}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                <MetricCard
                  label="Gasto líquido (viagens)"
                  value={formatCentsCompact(totalGastoLiquidoCents.toString())}
                  helper={totalGastos}
                  icon={Banknote}
                />
                <MetricCard
                  label="Total viagens"
                  value={formatCountCompact(gastos?.totalViagens ?? viagensTotalApi)}
                  helper={(gastos?.totalViagens ?? viagensTotalApi).toLocaleString("pt-BR")}
                  icon={Plane}
                />
                <MetricCard
                  label="Total emendas"
                  value={formatCountCompact(emendasTotalApi)}
                  helper={emendasTotalApi.toLocaleString("pt-BR")}
                  icon={FileText}
                />
                <MetricCard
                  label="Pago em emendas"
                  value={formatCentsCompact(emendasResumo.totalPagoCents)}
                  helper={formatCents(emendasResumo.totalPagoCents)}
                  icon={Landmark}
                />
              </motion.section>

              <PoliticoNewsSection
                politico={nomePoliticoNoticias}
                items={noticias?.items ?? []}
                total={noticias?.total ?? 0}
                isLoading={isNoticiasLoading}
                error={noticiasError as Error | null}
                onRetry={() => {
                  void refetchNoticias();
                }}
              />

              <section className="flex flex-col gap-6 xl:flex-row xl:items-start">
                <div className="min-w-0 flex-1 rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md sm:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-xl font-extrabold text-foreground">
                        Composição das viagens
                      </h2>
                      <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
                        Peso relativo de diárias, passagens e outros gastos no período.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-3.5 py-1.5 text-[11px] font-bold text-muted-foreground shadow-sm backdrop-blur-md">
                      {anoInicio}-{anoFim}
                    </div>
                  </div>

                  {pieData.length === 0 ? (
                    <div className="mt-6">
                      <EmptyState message="Sem valores de gastos para este período." />
                    </div>
                  ) : (
                    <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="rounded-[1.5rem] border border-white/60 bg-white/50 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
                        <div className="relative mx-auto h-[200px] w-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                innerRadius={58}
                                paddingAngle={3}
                                stroke="#ffffff"
                                strokeWidth={3}
                              >
                                {pieData.map((entry) => (
                                  <Cell key={entry.name} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                formatter={(value: number) =>
                                  value.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                    maximumFractionDigits: 0,
                                  })
                                }
                                contentStyle={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center drop-shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                              Gasto líquido
                            </p>
                            <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
                              {formatCentsCompact(totalGastoLiquidoCents.toString())}
                            </p>
                            <p className="mt-1.5 text-[10px] font-medium uppercase text-muted-foreground">
                              após devoluções
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {pieData.map((item) => (
                          <div
                            key={item.name}
                            className="group rounded-[1.5rem] border border-white/60 bg-white/50 px-5 py-5 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                  <span
                                    className="h-3 w-3 rounded-full shadow-sm transition-transform group-hover:scale-125"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <p className="text-[15px] font-extrabold text-foreground">
                                    {item.name}
                                  </p>
                                </div>
                                <p className="mt-2 text-[12px] font-medium text-muted-foreground">
                                  {formatCents(String(Math.round(item.value * 100)))}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[17px] font-extrabold text-primary">
                                  {item.share.toFixed(1)}%
                                </p>
                                <p className="text-[11px] font-medium text-muted-foreground">do bruto</p>
                              </div>
                            </div>
                            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/60 shadow-inner ring-1 ring-black/5">
                              <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${Math.max(item.share, 8)}%`, backgroundColor: item.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full space-y-6 xl:w-[340px] xl:flex-none">
                  <section className="rounded-[1.5rem] border border-white/60 bg-white/40 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
                    <h2 className="mb-4 text-[15px] font-extrabold text-foreground">Painel financeiro</h2>
                    <div className="space-y-3">
                      <SummaryRow
                        label="Gasto bruto"
                        value={formatCentsCompact(totalGastoBrutoCents.toString())}
                        helper={formatCents(totalGastoBrutoCents.toString())}
                      />
                      <SummaryRow
                        label="Devoluções"
                        value={formatCentsCompact(totalDevolucaoCents.toString())}
                        helper={formatCents(totalDevolucaoCents.toString())}
                      />
                      <SummaryRow
                        label="Pagamentos"
                        value={formatCentsCompact(totalPagamentosCents.toString())}
                        helper={formatCents(totalPagamentosCents.toString())}
                      />
                    </div>
                  </section>

                  <section className="rounded-[1.5rem] border border-white/60 bg-white/40 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
                    <h2 className="mb-4 text-[15px] font-extrabold text-foreground">Resumo de emendas</h2>
                    <div className="space-y-3">
                      <SummaryRow
                        label="Empenhado"
                        value={formatCentsCompact(emendasResumo.totalEmpenhadoCents)}
                        helper={formatCents(emendasResumo.totalEmpenhadoCents)}
                      />
                      <SummaryRow
                        label="Liquidado"
                        value={formatCentsCompact(emendasResumo.totalLiquidadoCents)}
                        helper={formatCents(emendasResumo.totalLiquidadoCents)}
                      />
                      <SummaryRow
                        label="Pago"
                        value={formatCentsCompact(emendasResumo.totalPagoCents)}
                        helper={formatCents(emendasResumo.totalPagoCents)}
                      />
                      <SummaryRow
                        label="Favorecidos"
                        value={formatCountCompact(emendasResumo.totalFavorecidos)}
                        helper={`${emendasResumo.totalFavorecidos.toLocaleString("pt-BR")} entidades`}
                      />
                      <SummaryRow
                        label="Recebido"
                        value={formatCentsCompact(emendasResumo.totalRecebidoFavorecidosCents)}
                        helper={formatCents(emendasResumo.totalRecebidoFavorecidosCents)}
                      />
                    </div>
                  </section>
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md sm:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-3 text-xl font-extrabold text-foreground">
                      <div className="rounded-[1rem] bg-gradient-to-br from-amber-200/50 to-amber-100 p-2 text-amber-600 shadow-sm ring-1 ring-amber-200/50">
                        <Plane className="h-5 w-5" />
                      </div>
                      Viagens Oficiais
                    </h2>
                    <p className="mt-2 text-xs font-medium text-muted-foreground sm:text-sm">
                      Registros paginados de deslocamento no recorte selecionado.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-[11px] font-bold text-muted-foreground shadow-sm backdrop-blur-md">
                    {formatCountCompact(viagensTotalView)} viagens
                  </div>
                </div>

                {viagensPage.length === 0 ? (
                  <EmptyState message="Nenhuma viagem registrada neste período." />
                ) : (
                  <>
                    <div className="space-y-4 md:hidden">
                      {viagensPage.map((viagem, index) => (
                        <MobileViagemCard key={viagem.processoId || index} viagem={viagem} />
                      ))}
                    </div>

                    <div className="hidden overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/50 shadow-sm ring-1 ring-black/5 backdrop-blur-md md:block">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-sm">
                          <thead>
                            <tr className="border-b border-white/60 text-left text-muted-foreground">
                              <th className="px-5 py-4 font-bold uppercase tracking-[0.1em] text-[10px]">Período</th>
                              <th className="px-5 py-4 font-bold uppercase tracking-[0.1em] text-[10px]">Motivo</th>
                              <th className="px-5 py-4 font-bold uppercase tracking-[0.1em] text-[10px]">Trechos</th>
                              <th className="px-5 py-4 text-right font-bold uppercase tracking-[0.1em] text-[10px]">Diárias</th>
                              <th className="px-5 py-4 text-right font-bold uppercase tracking-[0.1em] text-[10px]">Passagens</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/40">
                            {viagensPage.map((viagem, index) => (
                              <tr key={viagem.processoId || index} className="transition-colors hover:bg-white/60">
                                <td className="px-5 py-3.5 font-medium text-muted-foreground">
                                  {formatDate(viagem.dataInicio)} - {formatDate(viagem.dataFim)}
                                </td>
                                <td className="max-w-[240px] truncate px-5 py-3.5 font-bold text-foreground">
                                  {viagem.motivo || "-"}
                                </td>
                                <td className="max-w-[240px] truncate px-5 py-3.5 text-xs text-muted-foreground">
                                  {buildTrechosLabel(viagem)}
                                </td>
                                <td className="px-5 py-3.5 text-right font-extrabold text-primary">
                                  {formatCents(viagem.valorDiariasCents)}
                                </td>
                                <td className="px-5 py-3.5 text-right font-extrabold text-accent">
                                  {formatCents(viagem.valorPassagensCents)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {viagensTotalView > PAGE_SIZE ? (
                      <div className="mt-6">
                        <PaginationControls
                          total={viagensTotalView}
                          limit={PAGE_SIZE}
                          offset={viagensOffset}
                          onPageChange={setViagensOffset}
                          itemLabel="viagens"
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </section>

              <section className="rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md sm:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-3 text-xl font-extrabold text-foreground">
                      <div className="rounded-[1rem] bg-gradient-to-br from-primary/20 to-primary/5 p-2 text-primary shadow-sm ring-1 ring-primary/20">
                        <FileText className="h-5 w-5" />
                      </div>
                      Emendas Parlamentares
                    </h2>
                    <p className="mt-2 text-xs font-medium text-muted-foreground sm:text-sm">
                      Itens paginados com valores de empenho, liquidação e pagamento.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-[11px] font-bold text-muted-foreground shadow-sm backdrop-blur-md">
                    {formatCountCompact(emendasTotalView)} emendas
                  </div>
                </div>

                {emendasPage.length === 0 ? (
                  <EmptyState message="Nenhuma emenda registrada neste período." />
                ) : (
                  <>
                    <div className="space-y-4 md:hidden">
                      {emendasPage.map((emenda, index) => (
                        <MobileEmendaCard key={emenda.id || index} emenda={emenda} />
                      ))}
                    </div>

                    <div className="hidden overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/50 shadow-sm ring-1 ring-black/5 backdrop-blur-md md:block">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                          <thead>
                            <tr className="border-b border-white/60 text-left text-muted-foreground">
                              <th className="px-5 py-4 font-bold uppercase tracking-[0.1em] text-[10px]">Ano</th>
                              <th className="px-5 py-4 font-bold uppercase tracking-[0.1em] text-[10px]">Tipo</th>
                              <th className="px-5 py-4 font-bold uppercase tracking-[0.1em] text-[10px]">Código</th>
                              <th className="px-5 py-4 text-right font-bold uppercase tracking-[0.1em] text-[10px]">Empenhado</th>
                              <th className="px-5 py-4 text-right font-bold uppercase tracking-[0.1em] text-[10px]">Liquidado</th>
                              <th className="px-5 py-4 text-right font-bold uppercase tracking-[0.1em] text-[10px]">Pago</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/40">
                            {emendasPage.map((emenda, index) => (
                              <tr key={emenda.id || index} className="transition-colors hover:bg-white/60">
                                <td className="px-5 py-3.5 font-extrabold text-foreground">
                                  {emenda.anoEmenda || "-"}
                                </td>
                                <td className="px-5 py-3.5 font-medium text-muted-foreground">
                                  {emenda.tipoEmenda || "-"}
                                </td>
                                <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-muted-foreground/70">
                                  {emenda.codigoEmenda || "-"}
                                </td>
                                <td className="px-5 py-3.5 text-right font-bold text-muted-foreground">
                                  {formatCents(emenda.valorEmpenhadoCents)}
                                </td>
                                <td className="px-5 py-3.5 text-right font-bold text-muted-foreground">
                                  {formatCents(emenda.valorLiquidadoCents)}
                                </td>
                                <td className="px-5 py-3.5 text-right font-extrabold text-primary">
                                  {formatCents(emenda.valorPagoCents)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {emendasTotalView > PAGE_SIZE ? (
                      <div className="mt-6">
                        <PaginationControls
                          total={emendasTotalView}
                          limit={PAGE_SIZE}
                          offset={emendasOffset}
                          onPageChange={setEmendasOffset}
                          itemLabel="emendas"
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </section>
                  {perfilExterno ? (
                  <PerfilExternoSection
                    perfil={perfilExterno}
                    lexmlLimit={LEXML_PAGE_SIZE}
                    lexmlOffset={lexmlOffset}
                    onLexmlPageChange={setLexmlOffset}
                  />
                  ) : isPerfilExternoLoading ? (
                    <Skeleton className="h-72 w-full rounded-[2rem] bg-white/40 backdrop-blur-md" />
                  ) : null}
              </div>
            ) : null}
          </div>
        </main>
      </div>
  );
};

const MetricCard = ({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper?: string;
  icon: typeof Banknote;
}) => (
  <article className="group relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/40 p-5 shadow-lg ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/80 hover:bg-white/60 hover:shadow-xl">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-50" />
    <div className="relative">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors group-hover:text-foreground">
          {label}
        </p>
        <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-foreground drop-shadow-sm sm:text-3xl">{value}</p>
      {helper ? <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">{helper}</p> : null}
    </div>
  </article>
);

const SummaryRow = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) => (
  <div className="flex flex-col gap-1.5 rounded-[1.25rem] border border-white/60 bg-white/60 px-4 py-3.5 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-colors hover:bg-white/80 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
    <span className="text-[13px] font-bold text-muted-foreground">{label}</span>
    <span className="sm:text-right">
      <span className="block text-sm font-extrabold text-foreground">{value}</span>
      {helper ? <span className="block text-[11px] font-medium text-muted-foreground">{helper}</span> : null}
    </span>
  </div>
);

const ExternalSubcard = ({
  title,
  helper,
  children,
}: {
  title: string;
  helper?: string;
  children: ReactNode;
}) => (
  <div className="rounded-[1.25rem] border border-white/60 bg-white/50 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
    <div className="mb-3 flex items-start justify-between gap-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </p>
      {helper ? <p className="text-[10px] font-medium text-muted-foreground">{helper}</p> : null}
    </div>
    <div className="space-y-2.5">{children}</div>
  </div>
);

const MobileViagemCard = ({ viagem }: { viagem: Viagem }) => (
  <article className="rounded-[1.5rem] border border-white/60 bg-white/50 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[15px] font-extrabold leading-tight text-foreground">
          {viagem.motivo || viagem.destinos || "Viagem oficial"}
        </p>
        <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
          {formatDate(viagem.dataInicio)} - {formatDate(viagem.dataFim)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[15px] font-extrabold tracking-tight text-primary">
          {formatCentsCompact(buildViagemLiquidaCents(viagem))}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">estimado</p>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
      {viagem.orgaoSolicitanteNome ? (
        <span className="rounded-full bg-white/80 px-2.5 py-1 text-slate-600 shadow-sm ring-1 ring-black/5">
          {viagem.orgaoSolicitanteNome}
        </span>
      ) : null}
      {viagem.situacao ? (
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary shadow-sm">
          {viagem.situacao}
        </span>
      ) : null}
    </div>

    <p className="mt-4 text-xs font-medium leading-relaxed text-muted-foreground">{buildTrechosLabel(viagem)}</p>

    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <SummaryRow
        label="Diárias"
        value={formatCentsCompact(viagem.valorDiariasCents)}
        helper={formatCents(viagem.valorDiariasCents)}
      />
      <SummaryRow
        label="Passagens"
        value={formatCentsCompact(viagem.valorPassagensCents)}
        helper={formatCents(viagem.valorPassagensCents)}
      />
    </div>
  </article>
);

const MobileEmendaCard = ({ emenda }: { emenda: Emenda }) => (
  <article className="rounded-[1.5rem] border border-white/60 bg-white/50 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[15px] font-extrabold text-foreground">
          {emenda.tipoEmenda || "Emenda parlamentar"}
        </p>
        <p className="mt-1.5 text-[11px] font-bold text-muted-foreground">Ano {emenda.anoEmenda || "-"}</p>
      </div>
      <div className="text-right">
        <p className="text-[15px] font-extrabold tracking-tight text-primary">
          {formatCentsCompact(emenda.valorPagoCents)}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">pago</p>
      </div>
    </div>

    <p className="mt-3 break-all font-mono text-[11px] font-bold text-muted-foreground/70">
      {emenda.codigoEmenda || "-"}
    </p>

    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <SummaryRow
        label="Empenhado"
        value={formatCentsCompact(emenda.valorEmpenhadoCents)}
        helper={formatCents(emenda.valorEmpenhadoCents)}
      />
      <SummaryRow
        label="Liquidado"
        value={formatCentsCompact(emenda.valorLiquidadoCents)}
        helper={formatCents(emenda.valorLiquidadoCents)}
      />
    </div>
  </article>
);

const DossieSkeleton = () => (
  <div className="space-y-6">
    <section className="rounded-[2rem] border border-white/50 bg-white/30 p-8 shadow-lg ring-1 ring-black/5 backdrop-blur-md">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Skeleton className="h-28 w-28 rounded-[1.5rem] bg-white/60" />
        <div className="flex-1 space-y-4 pt-2">
          <Skeleton className="h-6 w-36 rounded-full bg-white/60" />
          <Skeleton className="h-10 w-80 bg-white/60" />
          <Skeleton className="h-5 w-64 bg-white/60" />
          <Skeleton className="h-4 w-72 bg-white/60" />
        </div>
      </div>
    </section>
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-[1.5rem] bg-white/40 backdrop-blur-md shadow-sm" />
      ))}
    </section>
    <Skeleton className="h-80 w-full rounded-[2rem] bg-white/40 backdrop-blur-md shadow-sm" />
    <Skeleton className="h-80 w-full rounded-[2rem] bg-white/40 backdrop-blur-md shadow-sm" />
  </div>
);

const PerfilExternoSection = ({
  perfil,
  lexmlLimit,
  lexmlOffset,
  onLexmlPageChange,
}: {
  perfil: PerfilExterno;
  lexmlLimit: number;
  lexmlOffset: number;
  onLexmlPageChange: (offset: number) => void;
}) => {
  const lexmlDocs = perfil.lexml?.documentos ?? [];
  const lexmlTotal = perfil.lexml?.total ?? 0;
  const lexmlPageStart = lexmlDocs.length > 0 ? lexmlOffset + 1 : 0;
  const lexmlPageEnd = lexmlOffset + lexmlDocs.length;
  const lexmlHasPrevious = lexmlOffset > 0;
  const lexmlHasNext = lexmlOffset + lexmlDocs.length < lexmlTotal;

  const cards = [
    {
      key: "camara",
      icon: Building2,
      label: "Câmara dos Deputados",
      visible: Boolean(perfil.camara?.nome),
      content: (
        <>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-base font-extrabold text-foreground">{perfil.camara?.nome}</p>
              {perfil.camara?.nomeCivil &&
              perfil.camara?.nomeCivil !== perfil.camara?.nome ? (
                <p className="mt-1 text-muted-foreground">Nome civil: <span className="font-bold text-foreground">{perfil.camara.nomeCivil}</span></p>
              ) : null}
              {perfil.camara?.nomeEleitoral &&
              perfil.camara?.nomeEleitoral !== perfil.camara?.nome ? (
                <p className="mt-1 text-muted-foreground">Nome eleitoral: <span className="font-bold text-foreground">{perfil.camara.nomeEleitoral}</span></p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
              {perfil.camara?.siglaPartido || perfil.camara?.siglaUf ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary shadow-sm">
                  {[perfil.camara?.siglaPartido, perfil.camara?.siglaUf].filter(Boolean).join("/")}
                </span>
              ) : null}
              {perfil.camara?.situacao ? (
                <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-700 shadow-sm">
                  {perfil.camara.situacao}
                </span>
              ) : null}
              {perfil.camara?.condicaoEleitoral ? (
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-slate-600 shadow-sm ring-1 ring-black/5">
                  {perfil.camara.condicaoEleitoral}
                </span>
              ) : null}
            </div>

            {perfil.camara?.idLegislatura ? (
              <p className="text-muted-foreground font-medium">Legislatura: <strong className="text-foreground">{perfil.camara.idLegislatura}</strong></p>
            ) : null}

            {perfil.camara?.dataStatus ? (
              <p className="text-[11px] text-muted-foreground">Atualizado em {formatDate(perfil.camara.dataStatus)}</p>
            ) : null}

            {perfil.camara?.descricaoStatus ? <p className="font-medium text-muted-foreground">{perfil.camara.descricaoStatus}</p> : null}

            {perfil.camara?.gabinete?.sala ||
            perfil.camara?.gabinete?.andar ||
            perfil.camara?.gabinete?.telefone ||
            perfil.camara?.gabinete?.email ? (
              <div className="rounded-[1.25rem] border border-white/60 bg-white/50 p-4 shadow-sm ring-1 ring-black/5">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Gabinete
                </p>
                <div className="mt-3 space-y-2 font-medium text-foreground">
                  {perfil.camara?.gabinete?.nome ? <p>{perfil.camara.gabinete.nome}</p> : null}
                  {perfil.camara?.gabinete?.sala ||
                  perfil.camara?.gabinete?.predio ||
                  perfil.camara?.gabinete?.andar ? (
                    <p>
                      {[
                        perfil.camara?.gabinete?.predio && `Prédio ${perfil.camara.gabinete.predio}`,
                        perfil.camara?.gabinete?.andar && `${perfil.camara.gabinete.andar}º andar`,
                        perfil.camara?.gabinete?.sala && `Sala ${perfil.camara.gabinete.sala}`,
                      ]
                        .filter(Boolean)
                        .join(" | ")}
                    </p>
                  ) : null}
                  {perfil.camara?.gabinete?.telefone ? (
                    <p className="inline-flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      {perfil.camara.gabinete.telefone}
                    </p>
                  ) : null}
                  {perfil.camara?.gabinete?.email ? (
                    <p className="inline-flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      {perfil.camara.gabinete.email}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {perfil.camara?.escolaridade ? (
              <p className="inline-flex items-center gap-2 font-medium text-foreground">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                {perfil.camara.escolaridade}
              </p>
            ) : null}

            {perfil.camara?.dataNascimento ? (
              <p className="inline-flex items-center gap-2 font-medium text-foreground">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {formatDate(perfil.camara.dataNascimento)}
                {perfil.camara?.municipioNascimento || perfil.camara?.ufNascimento
                  ? ` | ${[perfil.camara?.municipioNascimento, perfil.camara?.ufNascimento].filter(Boolean).join("/")}`
                  : ""}
              </p>
            ) : null}

            {perfil.camara?.sexo ? <p className="font-medium text-muted-foreground">Sexo: <strong className="text-foreground">{perfil.camara.sexo}</strong></p> : null}

            {perfil.camara?.email ? (
              <p className="inline-flex items-center gap-2 font-medium text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {perfil.camara.email}
              </p>
            ) : null}
            {perfil.camara?.urlWebsite ? (
              <a
                href={perfil.camara.urlWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 font-bold text-primary transition-colors hover:text-primary/80"
              >
                Site oficial <LinkIcon className="h-3.5 w-3.5" />
              </a>
            ) : null}
            {perfil.camara?.redesSociais?.slice(0, 2).map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block truncate font-bold text-primary transition-colors hover:text-primary/80"
              >
                {url}
              </a>
            ))}

            {perfil.camara?.despesasRecentes?.length ? (
              <ExternalSubcard
                title="Cota parlamentar recente"
                helper={`${perfil.camara?.despesasRecentesResumo?.totalItens ?? perfil.camara.despesasRecentes.length} registros`}
              >
                {perfil.camara?.despesasRecentesResumo?.totalLiquidoCents ? (
                  <p className="mb-3 text-[12px] font-extrabold text-primary">
                    {formatCentsCompact(perfil.camara.despesasRecentesResumo.totalLiquidoCents)} <span className="font-medium text-muted-foreground">líquidos no recorte recente</span>
                  </p>
                ) : null}
                <div className="space-y-2.5">
                  {perfil.camara.despesasRecentes.slice(0, 3).map((despesa, index) => (
                    <div
                      key={`${despesa.dataDocumento || despesa.tipoDespesa || "despesa"}-${index}`}
                      className="rounded-xl border border-white/60 bg-white/60 px-3.5 py-3 shadow-sm ring-1 ring-black/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-foreground">
                            {despesa.tipoDespesa || "Despesa parlamentar"}
                          </p>
                          {despesa.nomeFornecedor ? (
                            <p className="truncate mt-0.5 text-[11px] font-medium text-muted-foreground">
                              {despesa.nomeFornecedor}
                            </p>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-extrabold text-primary">
                            {formatCentsCompact(despesa.valorLiquidoCents)}
                          </p>
                          {despesa.dataDocumento ? (
                            <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                              {formatDate(despesa.dataDocumento)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ExternalSubcard>
            ) : null}

            {perfil.camara?.mandatosExternos?.length ? (
              <ExternalSubcard title="Mandatos anteriores">
                <div className="space-y-2.5">
                  {perfil.camara.mandatosExternos.slice(0, 3).map((mandato, index) => (
                    <div key={`${mandato.cargo || "mandato"}-${index}`} className="rounded-xl border border-white/60 bg-white/60 px-3.5 py-3 shadow-sm ring-1 ring-black/5">
                      <p className="font-bold text-foreground">
                        {mandato.cargo || "Cargo eletivo"}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                        {[mandato.municipio, mandato.siglaUf].filter(Boolean).join("/")}
                      </p>
                      <p className="text-[11px] font-bold text-muted-foreground">
                        {[mandato.anoInicio, mandato.anoFim].filter(Boolean).join(" - ")}
                        {mandato.siglaPartidoEleicao ? ` | ${mandato.siglaPartidoEleicao}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </ExternalSubcard>
            ) : null}

            {perfil.camara?.orgaos?.length || perfil.camara?.frentes?.length ? (
              <ExternalSubcard title="Atuação institucional">
                <div className="space-y-2.5">
                  {perfil.camara?.orgaos?.slice(0, 3).map((orgao, index) => (
                    <div key={`${orgao.idOrgao || orgao.siglaOrgao || "orgao"}-${index}`} className="rounded-xl border border-white/60 bg-white/60 px-3.5 py-3 shadow-sm ring-1 ring-black/5">
                      <p className="font-bold text-foreground">
                        {orgao.titulo || "Membro"}{orgao.siglaOrgao ? ` - ${orgao.siglaOrgao}` : ""}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-muted-foreground line-clamp-2">
                        {orgao.nomePublicacao || orgao.nomeOrgao}
                      </p>
                    </div>
                  ))}
                  {perfil.camara?.frentes?.slice(0, 2).map((frente, index) => (
                    <div key={`${frente.id || "frente"}-${index}`} className="rounded-xl border border-white/60 bg-white/60 px-3.5 py-3 shadow-sm ring-1 ring-black/5">
                      <p className="font-bold text-foreground">{frente.titulo}</p>
                      {frente.idLegislatura ? (
                        <p className="mt-1 text-[11px] font-medium text-muted-foreground">Legislatura {frente.idLegislatura}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </ExternalSubcard>
            ) : null}

            {perfil.camara?.profissoes?.length || perfil.camara?.ocupacoes?.length ? (
              <ExternalSubcard title="Profissões e ocupações">
                <div className="flex flex-wrap gap-2 mb-3">
                  {perfil.camara?.profissoes?.slice(0, 4).map((profissao, index) =>
                    profissao.titulo ? (
                      <span
                        key={`${profissao.titulo}-${index}`}
                        className="rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm ring-1 ring-black/5"
                      >
                        {profissao.titulo}
                      </span>
                    ) : null
                  )}
                </div>
                {perfil.camara?.ocupacoes?.slice(0, 2).map((ocupacao, index) => (
                  <div key={`${ocupacao.titulo || ocupacao.entidade || "ocupacao"}-${index}`} className="rounded-xl border border-white/60 bg-white/60 px-3.5 py-3 shadow-sm ring-1 ring-black/5">
                    <p className="font-bold text-foreground">
                      {ocupacao.titulo || ocupacao.entidade || "Ocupação registrada"}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                      {[ocupacao.entidade, ocupacao.entidadeUf, ocupacao.entidadePais].filter(Boolean).join(" | ")}
                    </p>
                  </div>
                ))}
              </ExternalSubcard>
            ) : null}

            {perfil.camara?.historico?.length ? (
              <ExternalSubcard title="Histórico recente">
                <div className="space-y-2.5">
                  {perfil.camara.historico.slice(0, 3).map((item, index) => (
                    <div key={`${item.dataHora || "historico"}-${index}`} className="rounded-xl border border-white/60 bg-white/60 px-3.5 py-3 shadow-sm ring-1 ring-black/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-foreground">
                            {[item.situacao, item.condicaoEleitoral].filter(Boolean).join(" | ") || "Atualização parlamentar"}
                          </p>
                          {item.descricaoStatus ? (
                            <p className="mt-1 line-clamp-2 text-[11px] font-medium text-muted-foreground">{item.descricaoStatus}</p>
                          ) : null}
                        </div>
                        {item.dataHora ? (
                          <p className="shrink-0 text-[10px] font-bold text-muted-foreground">{formatDate(item.dataHora)}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </ExternalSubcard>
            ) : null}

            {perfil.camara?.discursosRecentes?.length || perfil.camara?.eventosRecentes?.length ? (
              <ExternalSubcard title="Atividade recente na Câmara">
                <div className="space-y-2.5">
                  {perfil.camara?.discursosRecentes?.slice(0, 2).map((discurso, index) => (
                    <div key={`${discurso.dataHoraInicio || "discurso"}-${index}`} className="rounded-xl border border-white/60 bg-white/60 px-3.5 py-3 shadow-sm ring-1 ring-black/5">
                      <p className="font-bold text-foreground">
                        {discurso.tipoDiscurso || "Discurso registrado"}
                      </p>
                      {discurso.sumario ? (
                        <p className="mt-1 line-clamp-3 text-[11px] font-medium text-muted-foreground">{discurso.sumario}</p>
                      ) : null}
                    </div>
                  ))}
                  {perfil.camara?.eventosRecentes?.slice(0, 2).map((evento, index) => (
                    <div key={`${evento.id || evento.dataHoraInicio || "evento"}-${index}`} className="rounded-xl border border-white/60 bg-white/60 px-3.5 py-3 shadow-sm ring-1 ring-black/5">
                      <p className="font-bold text-foreground">
                        {evento.descricao || evento.descricaoTipo || "Evento parlamentar"}
                      </p>
                      <p className="mt-1 text-[11px] font-bold text-muted-foreground">
                        {[evento.situacao, evento.dataHoraInicio && formatDate(evento.dataHoraInicio)].filter(Boolean).join(" | ")}
                      </p>
                    </div>
                  ))}
                </div>
              </ExternalSubcard>
            ) : null}
          </div>
          {perfil.camara?.uri ? (
            <div className="mt-5 text-right">
              <a
                href={perfil.camara.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold text-primary shadow-sm backdrop-blur-md transition-colors hover:bg-primary hover:text-white"
              >
                Acessar fonte oficial <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : null}
        </>
      ),
    },
    {
      key: "senado",
      icon: Scale,
      label: "Senado Federal",
      visible: Boolean(perfil.senado?.nome),
      content: (
        <div className="space-y-3">
          <p className="text-base font-extrabold text-foreground">{perfil.senado?.nome}</p>
          <div className="flex flex-wrap gap-2 text-[11px] font-bold">
             <span className="rounded-full bg-primary/10 px-3 py-1.5 text-primary shadow-sm">
               {perfil.senado?.siglaPartido}/{perfil.senado?.uf}
             </span>
          </div>
          {perfil.senado?.email ? (
            <p className="inline-flex items-center gap-2 font-medium text-foreground">
              <Mail className="h-4 w-4 text-primary" />
              {perfil.senado.email}
            </p>
          ) : null}
          {perfil.senado?.urlPagina ? (
            <div className="mt-5">
              <a
                href={perfil.senado.urlPagina}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold text-primary shadow-sm backdrop-blur-md transition-colors hover:bg-primary hover:text-white"
              >
                Acessar fonte oficial <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "tse",
      icon: FileText,
      label: "TSE",
      visible: Boolean(
        perfil.tse?.datasetCandidatosUrl ||
          perfil.tse?.datasetResultadosUrl ||
          perfil.tse?.divulgaCandContasUrl
      ),
      content: (
        <>
          <p className="font-extrabold text-foreground">
            Referências oficiais do TSE para consulta eleitoral
          </p>
          {perfil.tse?.termoBusca ? (
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">
              Baseado na busca por <strong className="font-bold text-foreground">{perfil.tse.termoBusca}</strong>
            </p>
          ) : null}

          <div className="mt-4 space-y-2.5">
            {perfil.tse?.divulgaCandContasUrl ? (
              <a
                href={perfil.tse.divulgaCandContasUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-3 text-sm shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/90 hover:shadow-md"
              >
                <span className="font-bold text-foreground group-hover:text-primary">DivulgaCandContas</span>
                <ExternalLink className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
              </a>
            ) : null}
            {perfil.tse?.datasetCandidatosUrl ? (
              <a
                href={perfil.tse.datasetCandidatosUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-3 text-sm shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/90 hover:shadow-md"
              >
                <span className="font-bold text-foreground group-hover:text-primary">Dataset de candidatos</span>
                <ExternalLink className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
              </a>
            ) : null}
            {perfil.tse?.datasetResultadosUrl ? (
              <a
                href={perfil.tse.datasetResultadosUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-3 text-sm shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/90 hover:shadow-md"
              >
                <span className="font-bold text-foreground group-hover:text-primary">Dataset de resultados</span>
                <ExternalLink className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
              </a>
            ) : null}
          </div>
        </>
      ),
    },
    {
      key: "brasilio",
      icon: Database,
      label: "Brasil.IO",
      visible: Boolean((perfil.brasilIo?.total ?? 0) > 0),
      content: (
        <>
          <p className="font-extrabold text-foreground">
            {perfil.brasilIo?.total ?? 0} candidaturas encontradas
          </p>
          <div className="mt-3 space-y-2.5">
            {perfil.brasilIo?.candidatos?.slice(0, 3).map((candidato, index) => (
              <div key={index} className="rounded-xl border border-white/60 bg-white/60 px-4 py-3 shadow-sm ring-1 ring-black/5">
                <p className="font-bold text-foreground">{candidato.descricaoCargo}</p>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">{candidato.anoEleicao} • {candidato.siglaPartido}</p>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      key: "lexml",
      icon: Landmark,
      label: "LexML",
      visible: Boolean(lexmlTotal > 0),
      content: (
        <>
          <p className="font-extrabold text-foreground">
            {lexmlTotal} documentos legislativos
          </p>
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">
            {lexmlPageStart > 0
              ? `${lexmlPageStart}-${lexmlPageEnd} de ${lexmlTotal.toLocaleString("pt-BR")} resultados`
              : "Nenhum documento nesta página"}
          </p>

          <div className="mt-4 space-y-2.5">
            {lexmlDocs.map((doc, index) => (
              <a
                key={`${doc.url || doc.identificador || doc.titulo || "lexml"}-${index}`}
                href={doc.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl border border-white/60 bg-white/60 px-4 py-3 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/90 hover:shadow-md"
              >
                <p className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary">{doc.titulo}</p>
                <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {[doc.tipo, doc.data].filter(Boolean).join(" | ")}
                </p>
              </a>
            ))}
          </div>

          {lexmlTotal > lexmlLimit ? (
            <div className="mt-4 flex items-center justify-between gap-2 rounded-[1rem] border border-white/60 bg-white/50 px-3 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
              <button
                type="button"
                onClick={() => onLexmlPageChange(Math.max(0, lexmlOffset - lexmlLimit))}
                disabled={!lexmlHasPrevious}
                className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-3 py-1.5 text-[11px] font-bold text-foreground shadow-sm transition-colors hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </button>

              <span className="text-[11px] font-bold text-muted-foreground">
                Pág {Math.floor(lexmlOffset / lexmlLimit) + 1} de {Math.max(1, Math.ceil(lexmlTotal / lexmlLimit))}
              </span>

              <button
                type="button"
                onClick={() => onLexmlPageChange(lexmlOffset + lexmlLimit)}
                disabled={!lexmlHasNext}
                className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-3 py-1.5 text-[11px] font-bold text-foreground shadow-sm transition-colors hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </>
      ),
    },
    {
      key: "wikipedia",
      icon: Globe,
      label: "Wikipedia",
      visible: Boolean(perfil.wikipedia?.resumo),
      content: (
        <>
          <p className="line-clamp-5 text-sm font-medium leading-relaxed text-muted-foreground">{perfil.wikipedia?.resumo}</p>
          {perfil.wikipedia?.url ? (
            <div className="mt-4 text-right">
              <a
                href={perfil.wikipedia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold text-primary shadow-sm backdrop-blur-md transition-colors hover:bg-primary hover:text-white"
              >
                Ler artigo completo <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : null}
        </>
      ),
    },
  ].filter((card) => card.visible);

  if (!cards.length) return null;

  return (
    <section className="rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md sm:p-8">
      <h2 className="mb-6 flex items-center gap-3 text-xl font-extrabold">
        <div className="rounded-[1rem] bg-gradient-to-br from-accent/20 to-accent/5 p-2 text-accent shadow-sm ring-1 ring-accent/20">
          <Globe className="h-5 w-5" />
        </div>
        Perfil em fontes externas
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.key}
            className="rounded-[1.5rem] border border-white/60 bg-white/50 p-6 text-xs leading-5 text-muted-foreground shadow-lg ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/60 hover:shadow-xl"
          >
            <h3 className="mb-4 flex items-center gap-2.5 text-sm font-extrabold text-foreground">
              <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                <card.icon className="h-4 w-4" />
              </div>
              {card.label}
            </h3>
            <div className="space-y-1.5">{card.content}</div>
          </article>
        ))}
      </div>
    </section>
  );
};

function buildTrechosLabel(viagem: Viagem) {
  const trechos =
    viagem.trechos?.nodes
      ?.map((trecho) => `${trecho.origemCidade || "-"} -> ${trecho.destinoCidade || "-"}`)
      .filter(Boolean) ?? [];

  if (trechos.length) {
    return trechos.join(" | ");
  }

  return viagem.destinos || "Sem rota detalhada";
}

function buildViagemLiquidaCents(viagem: Viagem) {
  const total =
    toBigInt(viagem.valorDiariasCents) +
    toBigInt(viagem.valorPassagensCents) +
    toBigInt(viagem.valorOutrosGastosCents) -
    toBigInt(viagem.valorDevolucaoCents);

  return total.toString();
}

function buildEmendasResumo(emendas: Emenda[]) {
  let totalEmpenhado = 0n;
  let totalLiquidado = 0n;
  let totalPago = 0n;
  let totalRecebidoFavorecidos = 0n;
  let totalFavorecidos = 0;

  for (const emenda of emendas) {
    totalEmpenhado += toBigInt(emenda.valorEmpenhadoCents);
    totalLiquidado += toBigInt(emenda.valorLiquidadoCents);
    totalPago += toBigInt(emenda.valorPagoCents);

    const favorecidos = emenda.favorecidos?.nodes || [];
    totalFavorecidos += favorecidos.length;
    for (const fav of favorecidos) {
      totalRecebidoFavorecidos += toBigInt(fav.valorRecebidoCents);
    }
  }

  return {
    totalEmpenhadoCents: totalEmpenhado.toString(),
    totalLiquidadoCents: totalLiquidado.toString(),
    totalPagoCents: totalPago.toString(),
    totalRecebidoFavorecidosCents: totalRecebidoFavorecidos.toString(),
    totalFavorecidos,
  };
}

export default PoliticoDetalhe;
