import { Banknote, Landmark, MapPinned } from "lucide-react";
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

  return (
    <section className="animate-fade-up overflow-hidden rounded-3xl border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,247,237,0.98),rgba(255,255,255,0.96))] px-5 py-5 shadow-[0_18px_48px_-32px_rgba(120,53,15,0.45)] sm:px-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
            <Banknote className="h-3.5 w-3.5" />
            Impostometro
          </div>

          <div className="mt-4 min-h-[64px]">
            {isLoading && !brasil ? (
              <>
                <div className="h-6 w-48 animate-pulse rounded-full bg-amber-100/80" />
                <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded-full bg-amber-100/70" />
              </>
            ) : isError && !brasil ? (
              <>
                <p className="text-lg font-bold text-foreground">Impostometro indisponivel agora</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  O restante da plataforma continua funcionando. O painel tributario volta assim que a fonte responder.
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-extrabold tracking-tight text-foreground sm:text-[2rem]">
                  {brasil?.valorCompacto || brasil?.valorFormatado || "R$ --"}
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Arrecadacao tributaria acumulada no Brasil
                  {meta?.anoReferencia ? ` em ${meta.anoReferencia}` : ""} de{" "}
                  <strong className="text-foreground">{meta?.periodoInicio || "--"}</strong> ate{" "}
                  <strong className="text-foreground">{meta?.periodoFim || "--"}</strong>.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[540px]">
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
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-amber-200/70 pt-4 text-[11px] text-muted-foreground">
        <span>
          Fonte: <strong className="text-foreground">Impostometro</strong>
        </span>
        <span>
          Atualizado: <strong className="text-foreground">{formatCollectedAt(meta?.coletadoEm)}</strong>
        </span>
      </div>
    </section>
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
  return (
    <article className="rounded-2xl border border-amber-200/70 bg-white/80 px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>

      {loading ? (
        <>
          <div className="mt-3 h-5 w-24 animate-pulse rounded-full bg-amber-100/80" />
          <div className="mt-2 h-3 w-28 animate-pulse rounded-full bg-amber-100/70" />
        </>
      ) : (
        <>
          <p className="mt-3 text-base font-bold text-foreground">
            {group?.totalCompacto || group?.totalFormatado || "R$ --"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {group?.totalItens ? `${group.totalItens} tributos mapeados` : "Sem detalhamento agora"}
          </p>
        </>
      )}
    </article>
  );
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
