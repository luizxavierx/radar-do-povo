import { useEffect, useRef, useState } from "react";
import { Chrome } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => void;
  onFallbackDemo: () => void;
  className?: string;
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
            use_fedcm_for_prompt?: boolean;
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
  onFallbackDemo,
  className,
}: GoogleSignInButtonProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [buttonWidth, setButtonWidth] = useState(320);
  const [mode, setMode] = useState<"loading" | "official" | "fallback">(
    GOOGLE_CLIENT_ID ? "loading" : "fallback"
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setMode("fallback");
      return;
    }

    const render = () => {
      if (!window.google?.accounts?.id || !containerRef.current) {
        setMode("fallback");
        return;
      }

      containerRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            onCredential(response.credential);
          }
        },
        auto_select: false,
        use_fedcm_for_prompt: true,
      });
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
      render();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      const handleExistingError = () => setMode("fallback");
      existingScript.addEventListener("load", render, { once: true });
      existingScript.addEventListener("error", handleExistingError, { once: true });

      return () => {
        existingScript.removeEventListener("load", render);
        existingScript.removeEventListener("error", handleExistingError);
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.id = GOOGLE_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.onload = render;
    script.onerror = () => setMode("fallback");
    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [buttonWidth, onCredential]);

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
        <div
          ref={containerRef}
          className="min-h-[44px] rounded-full bg-white/90 shadow-sm [&>div]:mx-auto"
        />
      ) : null}

      {mode === "fallback" ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onFallbackDemo}
          className="h-12 w-full rounded-full border-border/80 bg-white text-foreground shadow-sm hover:bg-slate-50"
        >
          <Chrome className="h-4 w-4 text-[#4285F4]" />
          Continuar com Google
        </Button>
      ) : null}

      <p className="text-xs leading-5 text-muted-foreground">
        {GOOGLE_CLIENT_ID
          ? "Entrando com Google Identity Services para agilizar o onboarding dos membros."
          : "Google Client ID ainda nao configurado. O botao acima entra em modo demonstracao local para validar a experiencia."}
      </p>
    </div>
  );
};

export default GoogleSignInButton;
