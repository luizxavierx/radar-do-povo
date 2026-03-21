import {
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
  onRetry: () => void;
}

const ViagensKpis = ({ data, isLoading, error, onRetry }: ViagensKpisProps) => {
  if (isLoading) {
    return (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-2xl" />
        ))}
      </section>
    );
  }

  if (error) {
    return <ErrorStateWithRetry error={error} onRetry={onRetry} />;
  }

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        description="Total agregado da API"
        icon={CreditCard}
        variant="blue"
      />
      <StatsCard
        label="Viagens"
        value={String(data?.totalViagens ?? 0)}
        description="Quantidade total no recorte"
        icon={Plane}
        variant="yellow"
      />
      <StatsCard
        label="Viajantes"
        value={String(data?.totalViajantes ?? 0)}
        description="Pessoas no recorte"
        icon={Users}
        variant="blue"
      />
      <StatsCard
        label="Orgaos"
        value={String(
          (data?.totalOrgaosSuperiores ?? 0) + (data?.totalOrgaosSolicitantes ?? 0)
        )}
        description="Superiores e solicitantes"
        icon={Building2}
        variant="green"
      />
      <StatsCard
        label="Ticket medio"
        value={formatCents(data?.ticketMedioViagemCents)}
        description={`${data?.totalTrechos ?? 0} trechos registrados`}
        icon={Route}
        variant="yellow"
      />
    </section>
  );
};

export default ViagensKpis;
