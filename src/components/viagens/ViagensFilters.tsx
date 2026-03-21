import { useEffect, useState } from "react";
import { Calendar, Filter, RefreshCcw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export const travelYears = Array.from({ length: 10 }, (_, index) => 2026 - index);

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

  return (
    <section className="rounded-3xl border border-border/75 bg-card/88 p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
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
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Limpar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {recorteOptions.map((option) => {
            const active = value.recorte === option.id;

            return (
              <button
                key={option.id}
                onClick={() => onChange({ recorte: option.id })}
                className={`rounded-2xl border px-4 py-3 text-left transition-all ${
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

        <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">Filtros reais do banco</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Codigos, processo, PCDP e CPF funcionam como filtro exato. Nome, cargo, funcao,
              destino, motivo e situacao usam busca parcial com debounce.
            </p>
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
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            {value.anoInicio} a {value.anoFim}
          </Badge>
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
            Recorte: {recorteOptions.find((option) => option.id === value.recorte)?.label}
          </Badge>
          {activeBadges.map((badge) => (
            <Badge key={badge} variant="outline" className="border-border bg-background text-foreground">
              {badge}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ViagensFilters;
