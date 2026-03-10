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
}

interface ViagensFiltersProps {
  value: ViagensFilterState;
  onChange: (patch: Partial<ViagensFilterState>) => void;
  onReset: () => void;
}

const recorteOptions: { id: ViagensRecorte; label: string; hint: string }[] = [
  { id: "geral", label: "Geral", hint: "Somente parlamentares" },
  { id: "deputados", label: "Deputados", hint: "Recorte da Camara" },
  { id: "senadores", label: "Senadores", hint: "Recorte do Senado" },
];

const situacaoOptions = [
  { value: "TODAS", label: "Todas as situacoes" },
  { value: "PAGA", label: "Paga" },
  { value: "CONCLUIDA", label: "Concluida" },
  { value: "CANCELADA", label: "Cancelada" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
];

export const travelYears = Array.from({ length: 10 }, (_, index) => 2026 - index);

const ViagensFilters = ({ value, onChange, onReset }: ViagensFiltersProps) => {
  const [searchInput, setSearchInput] = useState(value.search);

  useEffect(() => {
    setSearchInput(value.search);
  }, [value.search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput !== value.search) {
        onChange({ search: searchInput });
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [onChange, searchInput, value.search]);

  const activeBadges = [
    value.search ? `Busca: ${value.search}` : "",
    value.orgaoSuperiorCodigo ? `Orgao superior: ${value.orgaoSuperiorCodigo}` : "",
    value.orgaoSolicitanteCodigo
      ? `Orgao solicitante: ${value.orgaoSolicitanteCodigo}`
      : "",
    value.situacao ? `Situacao: ${value.situacao}` : "",
  ].filter(Boolean);

  return (
    <section className="rounded-3xl border border-border/75 bg-card/88 p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Filter className="h-3.5 w-3.5" />
              Filtros da Area
            </p>
            <h2 className="text-xl font-extrabold text-foreground">Recorte e filtros avancados</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada bloco da tela reage ao mesmo filtro, com carregamento e retry independentes.
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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Busca livre
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Nome, cargo, motivo ou orgao"
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

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Situacao
            </label>
            <Select
              value={value.situacao || "TODAS"}
              onValueChange={(nextValue) =>
                onChange({ situacao: nextValue === "TODAS" ? "" : nextValue })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as situacoes" />
              </SelectTrigger>
              <SelectContent>
                {situacaoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Codigo do orgao superior
            </label>
            <Input
              value={value.orgaoSuperiorCodigo}
              onChange={(event) => onChange({ orgaoSuperiorCodigo: event.target.value })}
              placeholder="Ex.: 26000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Codigo do orgao solicitante
            </label>
            <Input
              value={value.orgaoSolicitanteCodigo}
              onChange={(event) => onChange({ orgaoSolicitanteCodigo: event.target.value })}
              placeholder="Ex.: 26298"
            />
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
