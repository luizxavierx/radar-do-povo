import { useEffect, useState } from "react";
import { Calendar, ChevronDown, Filter, RefreshCcw, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ViagensRecorte } from "@/services/viagensService";

export interface ViagensFilterState {
  recorte: ViagensRecorte;
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

const recorteOptions: { id: ViagensRecorte; label: string; hint: string }[] = [
  { id: "geral", label: "Geral", hint: "Sem filtro de parlamentares" },
  { id: "deputados", label: "Deputados", hint: "Recorte por cargo parlamentar" },
  { id: "senadores", label: "Senadores", hint: "Recorte por cargo parlamentar" },
];

const fieldMeta: { key: TextFilterKey; label: string; placeholder: string }[] = [
  { key: "processoId", label: "Processo ID", placeholder: "0001234-25.2024.1.00.0000" },
  { key: "pcdp", label: "PCDP", placeholder: "Codigo da proposta/viagem" },
  { key: "cpfViajante", label: "CPF do viajante", placeholder: "Somente numeros" },
  { key: "nomeViajante", label: "Nome do viajante", placeholder: "Ex.: Kim Kataguiri" },
  { key: "cargo", label: "Cargo", placeholder: "Ex.: Deputado Federal" },
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

const ViagensFilters = ({ value, onChange, onReset }: ViagensFiltersProps) => {
  const [textDraft, setTextDraft] = useState<Record<TextFilterKey, string>>(() =>
    pickTextFilters(value)
  );
  const [mobileAdvancedOpen, setMobileAdvancedOpen] = useState(false);

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
          <h3 className="text-sm font-bold text-foreground">Filtros reais do banco</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Codigos, processo, PCDP e CPF funcionam como filtro exato. Nome, cargo, funcao,
            destino, motivo e situacao usam busca parcial com debounce.
          </p>
        </div>

        <Badge variant="outline" className="border-border bg-card text-foreground">
          {activeFiltersCount} ativos
        </Badge>
      </div>

      {activeFiltersCount ? (
        <div className="mb-4 flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {activeBadges.slice(0, 6).map((badge) => (
            <Badge
              key={badge}
              variant="outline"
              className="border-border bg-card/80 text-foreground"
            >
              {badge}
            </Badge>
          ))}
          {activeFiltersCount > 6 ? (
            <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
              +{activeFiltersCount - 6} filtros
            </Badge>
          ) : null}
        </div>
      ) : null}

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
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="rounded-[28px] border border-border/75 bg-card/88 p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Filter className="h-3.5 w-3.5" />
              Filtros da Area
            </p>
            <h2 className="text-xl font-extrabold text-foreground">Recorte e filtros reais do banco</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Busca ampla, filtros exatos e filtros parciais do contrato oficial, todos sincronizados
              com a URL.
            </p>
          </div>

          <button
            onClick={onReset}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Limpar filtros
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:hidden">
          <article className="rounded-2xl border border-border/70 bg-background/80 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Periodo
            </p>
            <p className="mt-2 text-sm font-bold text-foreground">
              {value.anoInicio} a {value.anoFim}
            </p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-background/80 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Recorte
            </p>
            <p className="mt-2 text-sm font-bold text-foreground">
              {recorteOptions.find((option) => option.id === value.recorte)?.label}
            </p>
          </article>
          <article className="col-span-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              Filtros ativos
            </p>
            <p className="mt-2 text-sm font-bold text-foreground">
              {activeFiltersCount
                ? `${activeFiltersCount} filtro(s) aplicados`
                : "Nenhum filtro adicional alem do periodo"}
            </p>
          </article>
        </div>

        <div className="flex snap-x gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
          {recorteOptions.map((option) => {
            const active = value.recorte === option.id;

            return (
              <button
                key={option.id}
                onClick={() => onChange({ recorte: option.id })}
                className={`min-w-[210px] snap-start rounded-2xl border px-4 py-3 text-left transition-all sm:min-w-0 ${
                  active
                    ? "border-primary/35 bg-primary/10 shadow-card"
                    : "border-border bg-background hover:border-primary/20 hover:bg-muted/40"
                }`}
              >
                <p className="text-sm font-bold text-foreground">{option.label}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{option.hint}</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-[28px] border border-border/70 bg-background/60 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Busca e periodo base</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Estes campos definem o recorte principal antes dos filtros avancados.
              </p>
            </div>
            <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
              sempre visivel
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Busca textual ampla
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={textDraft.search}
                  onChange={(event) =>
                    setTextDraft((current) => ({ ...current, search: event.target.value }))
                  }
                  placeholder="Nome, cargo, funcao, destino, motivo ou orgao"
                  className="pl-9"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Busca parcial com debounce para leitura rapida no mobile.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Ano inicial
              </label>
              <Select
                value={String(value.anoInicio)}
                onValueChange={(nextValue) => onChange({ anoInicio: Number(nextValue) })}
              >
                <SelectTrigger>
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
                <SelectTrigger>
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
                  <p className="text-sm font-semibold text-foreground">Filtros avancados</p>
                  <p className="text-[11px] text-muted-foreground">
                    {activeFiltersCount
                      ? `${activeFiltersCount} filtros aplicados`
                      : "Abra para filtrar processo, CPF, orgaos e mais"}
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

        <div className="hidden lg:block">{advancedFiltersContent}</div>

        <div className="rounded-2xl border border-border/70 bg-background/65 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Resumo aplicado
            </p>
            <span className="text-[11px] text-muted-foreground">
              {activeFiltersCount
                ? `${activeFiltersCount} filtro(s) adicionais`
                : "Somente recorte e periodo"}
            </span>
          </div>

          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              {value.anoInicio} a {value.anoFim}
            </Badge>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              Recorte: {recorteOptions.find((option) => option.id === value.recorte)?.label}
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
      </div>
    </section>
  );
};

export default ViagensFilters;
