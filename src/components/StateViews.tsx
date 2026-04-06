import { Loader2, AlertTriangle, Inbox } from "lucide-react";
import { ApiRequestError } from "@/api/requestError";

function getErrorMessage(error: Error | null): string {
  if (!error) {
    return "Falha desconhecida durante a consulta.";
  }

  if (error.message.startsWith("Timeout:")) {
    return "A consulta demorou mais do que o esperado. Tente novamente em instantes.";
  }

  if (error instanceof ApiRequestError && error.statusCode === 429) {
    return "Muitas tentativas em sequência. Aguarde um pouco e tente novamente.";
  }

  return error.message || "Falha desconhecida durante a consulta.";
}

export const LoadingState = ({ message = "Carregando dados..." }: { message?: string }) => (
  <div className="editorial-panel-soft flex flex-col items-center justify-center gap-3 py-14 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-primary/12 bg-primary/8">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
    <p className="text-sm font-medium text-foreground">{message}</p>
    <p className="text-xs text-muted-foreground">Aguarde alguns segundos.</p>
  </div>
);

export const ErrorState = ({ error }: { error: Error | null }) => {
  const requestId = error instanceof ApiRequestError ? error.requestId : undefined;

  return (
    <div className="editorial-panel-soft flex flex-col items-center justify-center gap-3 border-destructive/20 bg-destructive/[0.04] py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-destructive/12">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-semibold text-foreground">Erro ao carregar dados da API</p>
      <p className="max-w-md text-xs text-muted-foreground">
        {getErrorMessage(error)}
      </p>
      {requestId ? (
        <p className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
          referencia: {requestId}
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
    <div className="editorial-panel-soft flex flex-col items-center justify-center gap-3 border-destructive/20 bg-destructive/[0.04] py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-destructive/12">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-semibold text-foreground">Erro ao carregar dados da API</p>
      <p className="max-w-md text-xs text-muted-foreground">
        {getErrorMessage(error)}
      </p>
      {requestId ? (
        <p className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
          referencia: {requestId}
        </p>
      ) : null}
      <button
        onClick={onRetry}
        className="rounded-[1rem] border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/18 hover:bg-primary/5"
      >
        {retryLabel}
      </button>
    </div>
  );
};

export const EmptyState = ({ message = "Nenhum dado encontrado" }: { message?: string }) => (
  <div className="editorial-panel-soft flex flex-col items-center justify-center gap-3 py-14 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-muted">
      <Inbox className="h-6 w-6 text-muted-foreground" />
    </div>
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);
