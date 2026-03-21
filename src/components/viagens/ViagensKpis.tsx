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
import { formatCents } from "@/lib/formatters";

interface ViagensKpisProps {
  data?: ResumoViagens;
  isLoading: boolean;
  error?: Error | null;
  isComplementLoading?: boolean;
  onRetry: () => void;
}

function moneyValue(value?: string, isPending?: boolean) {
  if (value !== undefined) {
    return formatCents(value);
  }

  return isPending ? "..." : "R$ 0,00";
}

function countValue(value?: number, isPending?: boolean) {
  if (value !== undefined) {
    return value.toLocaleString("pt-BR");
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
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Visao financeira
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Valores principais para leitura rapida no mobile.
            </p>
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
            prioridade alta
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatsCard
            label="Gasto liquido"
            value={formatCents(data?.totalGastoLiquidoCents)}
            description="Gasto bruto menos devolucoes"
            icon={Wallet}
            variant="green"
          />
          <StatsCard
            label="Gasto bruto"
            value={formatCents(data?.totalGastoBrutoCents)}
            description="Diarias, passagens e outros gastos"
            icon={CreditCard}
            variant="blue"
          />
          <StatsCard
            label="Pagamentos"
            value={moneyValue(data?.totalPagamentosCents, isComplementLoading)}
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
            value={formatCents(data?.totalPassagensCents)}
            description="Valor informado nas viagens"
            icon={CreditCard}
            variant="blue"
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Movimento do recorte
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Volume, cobertura e intensidade operacional.
            </p>
          </div>
          <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground">
            leitura secundaria
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatsCard
            label="Diarias"
            value={formatCents(data?.totalDiariasCents)}
            description="Valor informado nas viagens"
            icon={Route}
            variant="yellow"
          />
          <StatsCard
            label="Viagens"
            value={(data?.totalViagens ?? 0).toLocaleString("pt-BR")}
            description="Processos distintos no recorte"
            icon={Plane}
            variant="yellow"
          />
          <StatsCard
            label="Viajantes"
            value={(data?.totalViajantes ?? 0).toLocaleString("pt-BR")}
            description="Chave distinta por CPF ou nome"
            icon={Users}
            variant="blue"
          />
          <StatsCard
            label="Trechos"
            value={countValue(data?.totalTrechos, isComplementLoading)}
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
