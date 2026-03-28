import { ArrowRight, Chrome, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GoogleSignInButtonProps = {
  onStartAuth: () => void;
  className?: string;
  disabled?: boolean;
};

const GoogleSignInButton = ({
  onStartAuth,
  className,
  disabled = false,
}: GoogleSignInButtonProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={onStartAuth}
        disabled={disabled}
        className="h-14 w-full justify-between rounded-[20px] border-border/80 bg-white px-4 text-foreground shadow-sm transition-all hover:border-primary/25 hover:bg-slate-50"
      >
        <span className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#4285F4]" />
            ) : (
              <Chrome className="h-4 w-4 text-[#4285F4]" />
            )}
          </span>
          <span className="flex flex-col items-start text-left">
            <span className="text-sm font-semibold">
              {disabled ? "Abrindo o Google..." : "Continuar com Google"}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Use a mesma conta que vai administrar sua assinatura e sua chave.
            </span>
          </span>
        </span>

        <span className="hidden items-center gap-2 text-xs font-medium text-muted-foreground sm:inline-flex">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Redirecionamento seguro
          <ArrowRight className="h-4 w-4" />
        </span>
      </Button>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border/70 bg-background/85 px-3 py-1.5">
          Sem senha nova
        </span>
        <span className="rounded-full border border-border/70 bg-background/85 px-3 py-1.5">
          Sessao protegida no portal
        </span>
        <span className="rounded-full border border-border/70 bg-background/85 px-3 py-1.5">
          Retorno automatico ao portal
        </span>
      </div>
    </div>
  );
};

export default GoogleSignInButton;
