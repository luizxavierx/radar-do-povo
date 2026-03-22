import { useEffect, useState } from "react";
import {
  Calendar,
  ChevronDown,
  Filter,
  History,
  RefreshCcw,
  Save,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ViagensFilterState {
  anoInicio: number;
  anoFim: number;
  orgaoSuperiorCodigo: string;
  orgaoSolicitanteCodigo: string;
  search: string;
  situacao: string;
  processoId: string;
  pcdp: string;
  cpfViajante: string;
  nomeViajante: string;
  cargo: string;
  funcao: string;
  destino: string;
  motivo: string;
}

interface ViagensFiltersProps {
  value: ViagensFilterState;
  onChange: (patch: Partial<ViagensFilterState>) => void;
  onReset: () => void;
  onSaveView: () => void;
  onComparePreviousPeriod: () => void;
  canComparePreviousPeriod: boolean;
  savedViewLabel?: string;
}

type TextFilterKey =
  | "orgaoSuperiorCodigo"
  | "orgaoSolicitanteCodigo"
  | "search"
  | "situacao"
  | "processoId"
  | "pcdp"
  | "cpfViajante"
  | "nomeViajante"
  | "cargo"
  | "funcao"
  | "destino"
  | "motivo";

const TEXT_FILTER_KEYS: TextFilterKey[] = [
  "search",
  "situacao",
  "processoId",
  "pcdp",
  "cpfViajante",
  "nomeViajante",
  "cargo",
  "funcao",
  "destino",
  "motivo",
  "orgaoSuperiorCodigo",
  "orgaoSolicitanteCodigo",
];

const fieldMeta: { key: TextFilterKey; label: string; placeholder: string }[] = [
  { key: "processoId", label: "Processo ID", placeholder: "0001234-25.2024.1.00.0000" },
  { key: "pcdp", label: "PCDP", placeholder: "Codigo da proposta/viagem" },
  { key: "cpfViajante", label: "CPF do viajante", placeholder: "Somente numeros" },
  { key: "nomeViajante", label: "Nome do viajante", placeholder: "Ex.: Kim Kataguiri" },
  { key: "cargo", label: "Cargo", placeholder: "Ex.: assessor, servidor ou ministro" },
  { key: "funcao", label: "Funcao", placeholder: "Funcao ou descricao da funcao" },
  { key: "destino", label: "Destino", placeholder: "Ex.: Brasilia" },
  { key: "motivo", label: "Motivo", placeholder: "Ex.: missao oficial" },
  { key: "situacao", label: "Situacao", placeholder: "Ex.: CONCLUIDA" },
  { key: "orgaoSuperiorCodigo", label: "Orgao superior", placeholder: "Ex.: 26000" },
  {
    key: "orgaoSolicitanteCodigo",
    label: "Orgao solicitante",
    placeholder: "Ex.: 26298",
  },
];

const currentYear = new Date().getFullYear();
export const travelYears = Array.from({ length: 10 }, (_, index) => currentYear - index);

function pickTextFilters(value: ViagensFilterState): Record<TextFilterKey, string> {
  return {
    search: value.search,
    situacao: value.situacao,
    processoId: value.processoId,
    pcdp: value.pcdp,
    cpfViajante: value.cpfViajante,
    nomeViajante: value.nomeViajante,
    cargo: value.cargo,
    funcao: value.funcao,
    destino: value.destino,
    motivo: value.motivo,
    orgaoSuperiorCodigo: value.orgaoSuperiorCodigo,
    orgaoSolicitanteCodigo: value.orgaoSolicitanteCodigo,
  };
}

const ViagensFilters = ({
  value,
  onChange,
  onReset,
  onSaveView,
  onComparePreviousPeriod,
  canComparePreviousPeriod,
  savedViewLabel,
}: ViagensFiltersProps) => {
  const [textDraft, setTextDraft] = useState<Record<TextFilterKey, string>>(() =>
    pickTextFilters(value)
  );
  const [mobileAdvancedOpen, setMobileAdvancedOpen] = useState(false);
  const [desktopAdvancedOpen, setDesktopAdvancedOpen] = useState(false);

  useEffect(() => {
    setTextDraft(pickTextFilters(value));
  }, [
    value.cargo,
    value.cpfViajante,
    value.destino,
    value.funcao,
    value.motivo,
    value.nomeViajante,
    value.orgaoSolicitanteCodigo,
    value.orgaoSuperiorCodigo,
    value.pcdp,
    value.processoId,
    value.search,
    value.situacao,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const patch: Partial<ViagensFilterState> = {};

      TEXT_FILTER_KEYS.forEach((key) => {
        if (textDraft[key] !== value[key]) {
          patch[key] = textDraft[key];
        }
      });

      if (Object.keys(patch).length) {
        onChange(patch);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [onChange, textDraft, value]);

  const activeBadges = [
    value.search ? `Busca: ${value.search}` : "",
    value.processoId ? `Processo: ${value.processoId}` : "",
    value.pcdp ? `PCDP: ${value.pcdp}` : "",
    value.cpfViajante ? `CPF: ${value.cpfViajante}` : "",
    value.nomeViajante ? `Viajante: ${value.nomeViajante}` : "",
    value.cargo ? `Cargo: ${value.cargo}` : "",
    value.funcao ? `Funcao: ${value.funcao}` : "",
    value.destino ? `Destino: ${value.destino}` : "",
    value.motivo ? `Motivo: ${value.motivo}` : "",
    value.situacao ? `Situacao: ${value.situacao}` : "",
    value.orgaoSuperiorCodigo ? `Orgao superior: ${value.orgaoSuperiorCodigo}` : "",
    value.orgaoSolicitanteCodigo
      ? `Orgao solicitante: ${value.orgaoSolicitanteCodigo}`
      : "",
  ].filter(Boolean);
  const activeFiltersCount = activeBadges.length;

  const advancedFiltersContent = (
    <div className="rounded-[28px] border border-border/70 bg-background/70 p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Campos avancados do banco</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Processo, PCDP, CPF e codigos funcionam como busca exata. Nome, cargo, funcao,
            destino, motivo e situacao usam busca parcial.
          </p>
        </div>

        <Badge variant="outline" className="border-border bg-card text-foreground">
          {activeFiltersCount} ativos
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {fieldMeta.map((field) => (
          <div key={field.key} className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {field.label}
            </label>
            <Input
              value={textDraft[field.key]}
              onChange={(event) =>
                setTextDraft((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))
              }
              placeholder={field.placeholder}
              className="h-11 rounded-2xl border-border/70 bg-white"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="rounded-[30px] border border-border/75 bg-card/90 p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Filter className="h-3.5 w-3.5" />
              Console de filtros
            </p>
            <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
              Refine a leitura sem perder contexto
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Combine periodo, busca e campos oficiais do contrato para chegar rapido ao recorte
              mais relevante, mantendo a pagina limpa e pronta para leitura comparativa.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 xl:w-auto">
            <Button
              variant="outline"
              className="justify-center rounded-2xl bg-white"
              onClick={onComparePreviousPeriod}
              disabled={!canComparePreviousPeriod}
            >
              <History className="h-4 w-4" />
              Ano anterior
            </Button>
            <Button
              variant="outline"
              className="justify-center rounded-2xl bg-white"
              onClick={onSaveView}
            >
              <Save className="h-4 w-4" />
              {savedViewLabel ? "Visao salva" : "Salvar visao"}
            </Button>
            <Button
              variant="outline"
              className="justify-center rounded-2xl bg-white"
              onClick={onReset}
            >
              <RefreshCcw className="h-4 w-4" />
              Limpar filtros
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <div className="rounded-[28px] border border-border/70 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Busca principal
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={textDraft.search}
                    onChange={(event) =>
                      setTextDraft((current) => ({ ...current, search: event.target.value }))
                    }
                    placeholder="Nome, destino, motivo, cargo, funcao ou orgao"
                    className="h-11 rounded-2xl border-border/70 bg-white pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Ano inicial
                </label>
                <Select
                  value={String(value.anoInicio)}
                  onValueChange={(nextValue) => onChange({ anoInicio: Number(nextValue) })}
                >
                  <SelectTrigger className="h-11 rounded-2xl bg-white">
                    <SelectValue placeholder="Selecione o ano inicial" />
                  </SelectTrigger>
                  <SelectContent>
                    {travelYears.map((year) => (
                      <SelectItem key={`start-${year}`} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Ano final
                </label>
                <Select
                  value={String(value.anoFim)}
                  onValueChange={(nextValue) => onChange({ anoFim: Number(nextValue) })}
                >
                  <SelectTrigger className="h-11 rounded-2xl bg-white">
                    <SelectValue placeholder="Selecione o ano final" />
                  </SelectTrigger>
                  <SelectContent>
                    {travelYears.map((year) => (
                      <SelectItem key={`end-${year}`} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Situacao
                </label>
                <Input
                  value={textDraft.situacao}
                  onChange={(event) =>
                    setTextDraft((current) => ({ ...current, situacao: event.target.value }))
                  }
                  placeholder="Ex.: concluida"
                  className="h-11 rounded-2xl border-border/70 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
            <article className="rounded-2xl border border-border/70 bg-background/80 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Periodo
              </p>
              <p className="mt-2 text-sm font-bold text-foreground">
                {value.anoInicio} a {value.anoFim}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Recorte base da analise</p>
            </article>
            <article className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                Filtros ativos
              </p>
              <p className="mt-2 text-sm font-bold text-foreground">
                {activeFiltersCount ? `${activeFiltersCount} aplicados` : "Nenhum"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {savedViewLabel ? savedViewLabel : "Pronto para salvar a visao atual"}
              </p>
            </article>
          </div>
        </div>

        <div className="rounded-[28px] border border-border/70 bg-background/60 p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Filtros de apoio</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Use orgao, processo, CPF e campos textuais para refinar o recorte sem sobrecarregar
                a leitura principal.
              </p>
            </div>

            {activeFiltersCount ? (
              <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  <Calendar className="mr-1.5 h-3.5 w-3.5" />
                  {value.anoInicio} a {value.anoFim}
                </Badge>
                {activeBadges.slice(0, 5).map((badge) => (
                  <Badge
                    key={badge}
                    variant="outline"
                    className="border-border bg-background text-foreground"
                  >
                    {badge}
                  </Badge>
                ))}
                {activeFiltersCount > 5 ? (
                  <Badge variant="outline" className="border-border bg-background text-foreground">
                    +{activeFiltersCount - 5} filtros
                  </Badge>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Orgao superior
              </label>
              <Input
                value={textDraft.orgaoSuperiorCodigo}
                onChange={(event) =>
                  setTextDraft((current) => ({
                    ...current,
                    orgaoSuperiorCodigo: event.target.value,
                  }))
                }
                placeholder="Ex.: 26000"
                className="h-11 rounded-2xl border-border/70 bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Orgao solicitante
              </label>
              <Input
                value={textDraft.orgaoSolicitanteCodigo}
                onChange={(event) =>
                  setTextDraft((current) => ({
                    ...current,
                    orgaoSolicitanteCodigo: event.target.value,
                  }))
                }
                placeholder="Ex.: 26298"
                className="h-11 rounded-2xl border-border/70 bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Nome do viajante
              </label>
              <Input
                value={textDraft.nomeViajante}
                onChange={(event) =>
                  setTextDraft((current) => ({ ...current, nomeViajante: event.target.value }))
                }
                placeholder="Ex.: Kim Kataguiri"
                className="h-11 rounded-2xl border-border/70 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="lg:hidden">
          <Collapsible open={mobileAdvancedOpen} onOpenChange={setMobileAdvancedOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3 text-left shadow-sm transition-colors hover:bg-muted/40">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-primary/10 p-2 text-primary">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Abrir filtros avancados</p>
                  <p className="text-[11px] text-muted-foreground">
                    Processo, PCDP, CPF, cargo, funcao, destino e motivo
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  mobileAdvancedOpen ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">{advancedFiltersContent}</CollapsibleContent>
          </Collapsible>
        </div>

        <div className="hidden lg:block">
          <Collapsible open={desktopAdvancedOpen} onOpenChange={setDesktopAdvancedOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3 text-left shadow-sm transition-colors hover:bg-muted/40">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-primary/10 p-2 text-primary">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Mais refinamentos</p>
                  <p className="text-[11px] text-muted-foreground">
                    Expanda apenas quando precisar aprofundar a investigacao
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  desktopAdvancedOpen ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">{advancedFiltersContent}</CollapsibleContent>
          </Collapsible>
        </div>

        {activeFiltersCount ? (
          <div className="rounded-2xl border border-border/70 bg-background/65 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Filtros aplicados
              </p>
              <span className="text-[11px] text-muted-foreground">
                {activeFiltersCount} ativo(s)
              </span>
            </div>

            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                {value.anoInicio} a {value.anoFim}
              </Badge>
              {activeBadges.map((badge) => (
                <Badge
                  key={badge}
                  variant="outline"
                  className="border-border bg-background text-foreground"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ViagensFilters;
