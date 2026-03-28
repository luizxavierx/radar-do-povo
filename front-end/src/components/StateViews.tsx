import { Loader2, AlertTriangle, Inbox } from "lucide-react";
import { ApiRequestError } from "@/api/requestError";

export const LoadingState = ({ message = "Carregando dados..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card/70 py-14 text-center shadow-card">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-soft">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
    <p className="text-sm font-medium text-foreground">{message}</p>
    <p className="text-xs text-muted-foreground">Aguarde alguns segundos.</p>
  </div>
);

export const ErrorState = ({ error }: { error: Error | null }) => {
  const requestId = error instanceof ApiRequestError ? error.requestId : undefined;

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 py-14 text-center shadow-card">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-semibold text-foreground">Erro ao carregar dados da API</p>
      <p className="max-w-md text-xs text-muted-foreground">
        {error?.message || "Falha desconhecida durante a consulta."}
      </p>
      {requestId ? (
        <p className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
          request_id: {requestId}
        </p>
      ) : null}
    </div>
  );
};

export const ErrorStateWithRetry = ({
  error,
  onRetry,
  retryLabel = "Tentar novamente",
}: {
  error: Error | null;
  onRetry: () => void;
  retryLabel?: string;
}) => {
  const requestId = error instanceof ApiRequestError ? error.requestId : undefined;

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 py-14 text-center shadow-card">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-semibold text-foreground">Erro ao carregar dados da API</p>
      <p className="max-w-md text-xs text-muted-foreground">
        {error?.message || "Falha desconhecida durante a consulta."}
      </p>
      {requestId ? (
        <p className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
          request_id: {requestId}
        </p>
      ) : null}
      <button
        onClick={onRetry}
        className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
      >
        {retryLabel}
      </button>
    </div>
  );
};

export const EmptyState = ({ message = "Nenhum dado encontrado" }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card/70 py-14 text-center shadow-card">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
      <Inbox className="h-6 w-6 text-muted-foreground" />
    </div>
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);
