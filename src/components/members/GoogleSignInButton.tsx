import { Chrome, Loader2 } from "lucide-react";

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
    <div className={cn("space-y-3", className)}>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={onStartAuth}
        disabled={disabled}
        className="h-12 w-full rounded-full border-border/80 bg-white text-foreground shadow-sm hover:bg-slate-50"
      >
        {disabled ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#4285F4]" />
        ) : (
          <Chrome className="h-4 w-4 text-[#4285F4]" />
        )}
        {disabled ? "Redirecionando para o Google..." : "Continuar com Google"}
      </Button>

      <p className="text-xs leading-5 text-muted-foreground">
        O login agora usa o fluxo tradicional do Google: redirecionamento, callback seguro no
        backend e retorno do navegador ja autenticado ao portal.
      </p>
    </div>
  );
};

export default GoogleSignInButton;
