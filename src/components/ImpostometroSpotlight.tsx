import { Banknote, CalendarDays, Landmark, MapPinned } from "lucide-react";
import type { ImpostometroResumo, ImpostometroTributoGroup } from "@/api/types";

interface ImpostometroSpotlightProps {
  data?: ImpostometroResumo;
  isLoading?: boolean;
  isError?: boolean;
}

const esferaMeta: Array<{
  key: keyof NonNullable<ImpostometroResumo["tributos"]>;
  label: string;
  icon: typeof Landmark;
}> = [
  { key: "federal", label: "Federal", icon: Landmark },
  { key: "estadual", label: "Estadual", icon: MapPinned },
  { key: "municipal", label: "Municipal", icon: Banknote },
];

export default function ImpostometroSpotlight({
  data,
  isLoading,
  isError,
}: ImpostometroSpotlightProps) {
  const brasil = data?.brasil;
  const meta = data?.meta;
  const tributos = data?.tributos;
  const odometerGroups = buildOdometerGroups(brasil?.valor);

  return (
    <section className="animate-fade-up overflow-hidden rounded-3xl border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,248,235,0.96),rgba(255,255,255,0.98))] px-5 py-5 shadow-[0_20px_45px_-34px_rgba(120,53,15,0.5)] sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
            <Banknote className="h-3.5 w-3.5" />
            Impostometro
          </div>
          <h2 className="mt-3 text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
            Arrecadacao tributaria em tempo real
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            Painel compacto do Brasil com a leitura acumulada do ano e o peso por esfera tributaria.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-teal-200/70 bg-teal-50/80 px-3 py-2 text-[11px] font-medium text-teal-800">
          <CalendarDays className="h-3.5 w-3.5" />
          Atualizado {formatCollectedAt(meta?.coletadoEm)}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[28px] border border-teal-900/20 bg-[linear-gradient(135deg,rgba(17,108,112,0.96),rgba(14,128,134,0.94))] px-4 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:px-5">
        {isLoading && !brasil ? (
          <LoadingCounterBoard />
        ) : isError && !brasil ? (
          <ErrorCounterBoard />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PeriodChip label="De" value={meta?.periodoInicio || "--"} />
              <div className="rounded-2xl bg-white/12 px-4 py-2 text-center shadow-[0_10px_24px_-16px_rgba(0,0,0,0.35)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                  Brasil
                </p>
              </div>
              <PeriodChip label="Ate" value={meta?.periodoFim || "--"} />
            </div>

            <div className="mt-4 overflow-x-auto pb-1">
              <div className="mx-auto inline-flex min-w-max items-start gap-3">
                {odometerGroups.map((group) => (
                  <DigitGroup
                    key={group.key}
                    digits={group.digits}
                    label={group.label}
                  />
                ))}
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-white/75">
              Total acumulado no periodo de {meta?.periodoInicio || "--"} ate {meta?.periodoFim || "--"}.
            </p>
          </>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {esferaMeta.map(({ key, label, icon: Icon }) => (
          <EsferaCard
            key={key}
            label={label}
            icon={Icon}
            group={tributos?.[key]}
            loading={Boolean(isLoading && !data)}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-amber-200/70 pt-4 text-[11px] text-muted-foreground">
        <span>
          Fonte: <strong className="text-foreground">Impostometro</strong>
        </span>
        <span>
          Total Brasil: <strong className="text-foreground">{brasil?.valorFormatado || "R$ --"}</strong>
        </span>
      </div>
    </section>
  );
}

function PeriodChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs shadow-[0_8px_20px_-16px_rgba(0,0,0,0.4)]">
      <span className="font-semibold uppercase tracking-[0.16em] text-white/65">{label}</span>
      <span className="rounded-xl bg-slate-950/25 px-2.5 py-1 font-bold tracking-wide text-white">
        {value}
      </span>
    </div>
  );
}

function DigitGroup({
  digits,
  label,
}: {
  digits: string[];
  label: string;
}) {
  return (
    <div className="min-w-[74px] text-center">
      <div className="flex justify-center gap-1">
        {digits.map((digit, index) => (
          <span
            key={`${label}-${index}`}
            className="flex h-12 w-8 items-center justify-center rounded-xl border border-white/10 bg-slate-950/72 text-[1.85rem] font-black leading-none text-white shadow-[0_10px_24px_-18px_rgba(0,0,0,0.85)] sm:h-14 sm:w-9 sm:text-[2.15rem]"
          >
            {digit}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
        {label}
      </p>
    </div>
  );
}

function EsferaCard({
  label,
  icon: Icon,
  group,
  loading,
}: {
  label: string;
  icon: typeof Landmark;
  group?: ImpostometroTributoGroup;
  loading?: boolean;
}) {
  const destaque = group?.itens?.[0]?.nome;

  return (
    <article className="rounded-2xl border border-amber-200/70 bg-white/82 px-4 py-3 shadow-[0_14px_32px_-26px_rgba(120,53,15,0.38)]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>

      {loading ? (
        <>
          <div className="mt-3 h-5 w-24 animate-pulse rounded-full bg-amber-100/80" />
          <div className="mt-2 h-3 w-32 animate-pulse rounded-full bg-amber-100/70" />
        </>
      ) : (
        <>
          <p className="mt-3 text-lg font-extrabold tracking-tight text-foreground">
            {group?.totalCompacto || group?.totalFormatado || "R$ --"}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
            {destaque
              ? `Maior rubrica agora: ${destaque}.`
              : group?.totalItens
                ? `${group.totalItens} tributos monitorados nesta esfera.`
                : "Sem detalhamento agora."}
          </p>
        </>
      )}
    </article>
  );
}

function LoadingCounterBoard() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="h-10 w-32 animate-pulse rounded-2xl bg-white/12" />
        <div className="h-10 w-24 animate-pulse rounded-2xl bg-white/12" />
        <div className="h-10 w-32 animate-pulse rounded-2xl bg-white/12" />
      </div>
      <div className="mt-4 flex gap-2 overflow-hidden">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="h-12 w-8 animate-pulse rounded-xl bg-slate-950/40 sm:h-14 sm:w-9"
          />
        ))}
      </div>
      <div className="mt-4 h-3 w-64 max-w-full animate-pulse rounded-full bg-white/12" />
    </div>
  );
}

function ErrorCounterBoard() {
  return (
    <div className="rounded-2xl border border-white/12 bg-slate-950/18 px-4 py-4 text-center">
      <p className="text-sm font-bold text-white">Impostometro indisponivel agora</p>
      <p className="mt-2 text-xs leading-6 text-white/75">
        O restante da plataforma continua funcionando. O bloco tributario volta assim que a fonte responder.
      </p>
    </div>
  );
}

function buildOdometerGroups(value?: number): Array<{
  key: string;
  label: string;
  digits: string[];
}> {
  const fallback = [
    { key: "reais", label: "Reais", digits: ["0", "0", "0"] },
    { key: "centavos", label: "Centavos", digits: ["0", "0"] },
  ];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  const [integerPart, decimalPart = "00"] = formatted.split(",");
  const integerGroups = integerPart.split(".").filter(Boolean);

  const groups = integerGroups.map((group, index) => {
    const magnitudeIndex = integerGroups.length - 1 - index;

    return {
      key: `magnitude-${magnitudeIndex}`,
      label: magnitudeLabel(magnitudeIndex, Number.parseInt(group, 10)),
      digits: group.split(""),
    };
  });

  groups.push({
    key: "centavos",
    label: "Centavos",
    digits: decimalPart.split(""),
  });

  return groups;
}

function magnitudeLabel(index: number, groupValue: number): string {
  const labels = [
    { singular: "Real", plural: "Reais" },
    { singular: "Mil", plural: "Mil" },
    { singular: "Milhao", plural: "Milhoes" },
    { singular: "Bilhao", plural: "Bilhoes" },
    { singular: "Trilhao", plural: "Trilhoes" },
    { singular: "Quadrilhao", plural: "Quadrilhoes" },
  ];

  const label = labels[index];
  if (!label) {
    return "Grupo";
  }

  return groupValue === 1 ? label.singular : label.plural;
}

function formatCollectedAt(value?: string): string {
  if (!value) {
    return "--";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}
