import { Banknote, CalendarDays } from "lucide-react";
import type { ImpostometroResumo } from "@/api/types";

interface ImpostometroSpotlightProps {
  data?: ImpostometroResumo;
  isLoading?: boolean;
  isError?: boolean;
}

export default function ImpostometroSpotlight({
  data,
  isLoading,
  isError,
}: ImpostometroSpotlightProps) {
  const brasil = data?.brasil;
  const meta = data?.meta;
  const odometerGroups = buildOdometerGroups(brasil?.valor);

  return (
    <section className="animate-fade-up overflow-hidden rounded-3xl border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,248,235,0.96),rgba(255,255,255,0.98))] px-5 py-5 shadow-[0_20px_45px_-34px_rgba(120,53,15,0.5)] sm:px-6 sm:py-6">
      <ImpostometroMotionStyles />
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

      <div className="relative mt-4 overflow-hidden rounded-[28px] border border-teal-900/20 bg-[linear-gradient(135deg,rgba(14,112,118,0.98),rgba(18,140,146,0.95))] px-4 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:px-5">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2.5rem] bg-[rgba(255,205,54,0.24)] blur-[0.5px]"
            style={{ animation: "imposto-breathe 9s ease-in-out infinite" }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-[rgba(21,53,122,0.34)]"
            style={{ animation: "imposto-drift 14s ease-in-out infinite" }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-2 w-20 -translate-x-1/2 -translate-y-1/2 rotate-[12deg] rounded-full bg-white/35 blur-[0.5px]"
            style={{ animation: "imposto-band 11s ease-in-out infinite" }}
          />
          <div
            className="absolute -left-10 top-8 h-28 w-28 rounded-full bg-[rgba(255,205,54,0.12)] blur-2xl"
            style={{ animation: "imposto-orbit 12s ease-in-out infinite" }}
          />
          <div
            className="absolute -right-12 bottom-0 h-36 w-36 rounded-full bg-[rgba(21,53,122,0.18)] blur-2xl"
            style={{ animation: "imposto-orbit 16s ease-in-out infinite reverse" }}
          />
          <div className="absolute inset-x-12 top-1/2 h-px -translate-y-1/2 bg-white/8" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%)]" />
        </div>

        <div className="relative">
          {isLoading && !brasil ? (
            <LoadingCounterBoard />
          ) : isError && !brasil ? (
            <ErrorCounterBoard />
          ) : (
            <>
              <div className="rounded-2xl bg-white/12 px-4 py-2 text-center shadow-[0_10px_24px_-16px_rgba(0,0,0,0.35)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                  Brasil
                </p>
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

function ImpostometroMotionStyles() {
  return (
    <style>{`
      @keyframes imposto-breathe {
        0%, 100% { transform: translate(-50%, -50%) rotate(45deg) scale(0.94); opacity: 0.22; }
        50% { transform: translate(-50%, -50%) rotate(45deg) scale(1.02); opacity: 0.34; }
      }

      @keyframes imposto-drift {
        0%, 100% { transform: translate(-50%, -50%) scale(0.96); opacity: 0.78; }
        50% { transform: translate(-48%, -52%) scale(1.04); opacity: 0.92; }
      }

      @keyframes imposto-band {
        0%, 100% { transform: translate(-50%, -50%) rotate(12deg) scaleX(0.88); opacity: 0.2; }
        50% { transform: translate(-50%, -50%) rotate(12deg) scaleX(1.06); opacity: 0.42; }
      }

      @keyframes imposto-orbit {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.35; }
        50% { transform: translate3d(10px, -8px, 0) scale(1.08); opacity: 0.5; }
      }
    `}</style>
  );
}
