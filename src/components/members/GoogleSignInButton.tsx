import { useEffect, useRef, useState } from "react";
import { Chrome } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MEMBER_PORTAL_DEMO } from "@/lib/members";
import { cn } from "@/lib/utils";

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
  onFallbackDemo?: () => void;
  className?: string;
  disabled?: boolean;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (input: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              type?: "standard";
              theme?: "outline" | "filled_blue" | "filled_black";
              text?: "signin_with" | "continue_with" | "signup_with";
              shape?: "rectangular" | "pill";
              size?: "large" | "medium" | "small";
              width?: number;
              logo_alignment?: "left" | "center";
            }
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = "radar-google-identity-script";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";

const GoogleSignInButton = ({
  onCredential,
  onError,
  onFallbackDemo,
  className,
  disabled = false,
}: GoogleSignInButtonProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [buttonWidth, setButtonWidth] = useState(320);
  const [mode, setMode] = useState<"loading" | "official" | "fallback">(
    GOOGLE_CLIENT_ID ? "loading" : "fallback"
  );

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setMode("fallback");
      return;
    }

    const renderButton = () => {
      if (!window.google?.accounts?.id || !containerRef.current) {
        setMode("fallback");
        return;
      }

      if (!initializedRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              onCredentialRef.current(response.credential);
              return;
            }

            onErrorRef.current?.(
              "O Google nao retornou uma credencial valida. Tente novamente em uma nova janela."
            );
          },
          auto_select: false,
        });
        initializedRef.current = true;
      }

      containerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: "outline",
        text: "continue_with",
        shape: "pill",
        size: "large",
        width: buttonWidth,
        logo_alignment: "left",
      });
      setMode("official");
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      const handleExistingLoad = () => renderButton();
      const handleExistingError = () => {
        setMode("fallback");
        onErrorRef.current?.(
          "Nao foi possivel carregar o login Google agora. Atualize a pagina e tente novamente."
        );
      };

      existingScript.addEventListener("load", handleExistingLoad, { once: true });
      existingScript.addEventListener("error", handleExistingError, { once: true });

      return () => {
        existingScript.removeEventListener("load", handleExistingLoad);
        existingScript.removeEventListener("error", handleExistingError);
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.id = GOOGLE_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.onload = () => renderButton();
    script.onerror = () => {
      setMode("fallback");
      onErrorRef.current?.(
        "Nao foi possivel carregar o login Google agora. Atualize a pagina e tente novamente."
      );
    };
    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [buttonWidth]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateWidth = () => {
      const nextWidth = Math.max(220, Math.min(360, Math.floor(element.clientWidth)));
      setButtonWidth((current) => (current === nextWidth ? current : nextWidth));
    };

    updateWidth();

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      {mode === "official" || mode === "loading" ? (
        <div className="relative">
          <div
            ref={containerRef}
            className="min-h-[44px] rounded-full bg-white/90 shadow-sm [&>div]:mx-auto"
          />
          {disabled ? (
            <div className="absolute inset-0 rounded-full bg-white/55" aria-hidden="true" />
          ) : null}
        </div>
      ) : null}

      {mode === "fallback" ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onFallbackDemo}
          disabled={disabled || !MEMBER_PORTAL_DEMO || !onFallbackDemo}
          className="h-12 w-full rounded-full border-border/80 bg-white text-foreground shadow-sm hover:bg-slate-50"
        >
          <Chrome className="h-4 w-4 text-[#4285F4]" />
          {MEMBER_PORTAL_DEMO ? "Continuar com Google" : "Google nao configurado"}
        </Button>
      ) : null}

      <p className="text-xs leading-5 text-muted-foreground">
        {GOOGLE_CLIENT_ID
          ? "Entrando com Google Identity Services com validacao server-side para o onboarding dos membros."
          : MEMBER_PORTAL_DEMO
            ? "Google Client ID ainda nao configurado. O ambiente local continua com fallback de demonstracao."
            : "Google Client ID ainda nao configurado. Defina a chave no frontend e no backend antes de publicar."}
      </p>
    </div>
  );
};

export default GoogleSignInButton;
