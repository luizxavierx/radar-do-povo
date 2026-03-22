import {
  Banknote,
  Building2,
  CreditCard,
  Plane,
  Route,
  Users,
  Wallet,
} from "lucide-react";
import type { ResumoViagens } from "@/api/types";
import StatsCard from "@/components/StatsCard";
import { ErrorStateWithRetry } from "@/components/StateViews";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCents, formatCentsCompact, formatCountCompact } from "@/lib/formatters";

interface ViagensKpisProps {
  data?: ResumoViagens;
  isLoading: boolean;
  error?: Error | null;
  isComplementLoading?: boolean;
  onRetry: () => void;
}

function moneyValue(value?: string, isPending?: boolean) {
  if (value !== undefined) {
    return formatCentsCompact(value);
  }

  return isPending ? "..." : "R$ 0,00";
}

function countValue(value?: number, isPending?: boolean) {
  if (value !== undefined) {
    return formatCountCompact(value);
  }

  return isPending ? "..." : "0";
}

const ViagensKpis = ({
  data,
  isLoading,
  error,
  isComplementLoading = false,
  onRetry,
}: ViagensKpisProps) => {
  if (isLoading) {
    return (
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-2xl" />
        ))}
      </section>
    );
  }

  if (error) {
    return <ErrorStateWithRetry error={error} onRetry={onRetry} />;
  }

  return (
    <section className="space-y-4">
      <div>
        <div className="mb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Visao financeira
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              O que mais importa para entender o gasto no periodo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatsCard
            label="Gasto liquido"
            value={formatCentsCompact(data?.totalGastoLiquidoCents)}
            helper={formatCents(data?.totalGastoLiquidoCents)}
            description="Gasto bruto menos devolucoes"
            icon={Wallet}
            variant="green"
          />
          <StatsCard
            label="Gasto bruto"
            value={formatCentsCompact(data?.totalGastoBrutoCents)}
            helper={formatCents(data?.totalGastoBrutoCents)}
            description="Diarias, passagens e outros gastos"
            icon={CreditCard}
            variant="blue"
          />
          <StatsCard
            label="Pagamentos"
            value={moneyValue(data?.totalPagamentosCents, isComplementLoading)}
            helper={
              data?.totalPagamentosCents !== undefined
                ? formatCents(data.totalPagamentosCents)
                : undefined
            }
            description={
              isComplementLoading
                ? "Complemento pesado carregando em segundo plano"
                : "Total somado da tabela pagamentos"
            }
            icon={Banknote}
            variant="green"
          />
          <StatsCard
            label="Passagens"
            value={formatCentsCompact(data?.totalPassagensCents)}
            helper={formatCents(data?.totalPassagensCents)}
            description="Valor informado nas viagens"
            icon={CreditCard}
            variant="blue"
          />
        </div>
      </div>

      <div>
        <div className="mb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Volume do recorte
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Quantidade de viagens, viajantes e trechos no periodo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatsCard
            label="Diarias"
            value={formatCentsCompact(data?.totalDiariasCents)}
            helper={formatCents(data?.totalDiariasCents)}
            description="Valor informado nas viagens"
            icon={Route}
            variant="yellow"
          />
          <StatsCard
            label="Viagens"
            value={formatCountCompact(data?.totalViagens ?? 0)}
            helper={(data?.totalViagens ?? 0).toLocaleString("pt-BR")}
            description="Processos distintos no recorte"
            icon={Plane}
            variant="yellow"
          />
          <StatsCard
            label="Viajantes"
            value={formatCountCompact(data?.totalViajantes ?? 0)}
            helper={(data?.totalViajantes ?? 0).toLocaleString("pt-BR")}
            description="Chave distinta por CPF ou nome"
            icon={Users}
            variant="blue"
          />
          <StatsCard
            label="Trechos"
            value={countValue(data?.totalTrechos, isComplementLoading)}
            helper={
              data?.totalTrechos !== undefined
                ? data.totalTrechos.toLocaleString("pt-BR")
                : undefined
            }
            description={
              isComplementLoading
                ? "Complemento pesado carregando em segundo plano"
                : "Total somado da tabela trechos"
            }
            icon={Building2}
            variant="green"
          />
        </div>
      </div>
    </section>
  );
};

export default ViagensKpis;
