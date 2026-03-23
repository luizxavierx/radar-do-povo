import { useEffect } from "react";
import { BookKey, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import AppSidebar from "@/components/AppSidebar";
import GoogleSignInButton from "@/components/members/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { useMemberSession } from "@/contexts/MemberSessionContext";
import { MEMBER_PLAN } from "@/lib/members";

const MembrosLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signInDemo, signInFromGoogle } = useMemberSession();

  const nextPath =
    typeof location.state === "object" &&
    location.state !== null &&
    "from" in location.state &&
    typeof location.state.from === "string"
      ? location.state.from
      : "/membros/dashboard";

  useEffect(() => {
    if (session) {
      navigate(nextPath, { replace: true });
    }
  }, [navigate, nextPath, session]);

  const handleGoogleCredential = (credential: string) => {
    try {
      const nextSession = signInFromGoogle(credential);
      toast.success(`Sessao iniciada para ${nextSession.name}.`);
      navigate(nextPath, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel entrar com Google.");
    }
  };

  const handleDemoFallback = () => {
    const nextSession = signInDemo();
    toast.success(`Modo demonstracao ativado para ${nextSession.name}.`);
    navigate(nextPath, { replace: true });
  };

  return (
    <div>
      <AppSidebar />

      <main className="lg:ml-72">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[1040px] items-center px-4 pb-10 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[34px] border border-white/70 bg-card/92 p-6 shadow-elevated sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Acesso de membros
              </div>
              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Entre para continuar com checkout, documentacao e painel da API.
              </h1>
              <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                O login Google simplifica o cadastro inicial e prepara a conta do membro para a
                ativacao da assinatura mensal.
              </p>

              <div className="mt-6 rounded-[28px] border border-border/70 bg-background/85 p-5 text-sm leading-6 text-muted-foreground">
                <p className="font-semibold text-foreground">O que voce encontra depois do login:</p>
                <ul className="mt-3 space-y-2">
                  <li>Checkout PIX com valor mensal de {MEMBER_PLAN.priceLabel}.</li>
                  <li>Painel inicial do membro com status do plano e area de acesso.</li>
                  <li>Documentacao oficial dos endpoints liberados para membros.</li>
                </ul>
              </div>

              <Button asChild variant="outline" className="mt-4 rounded-full">
                <Link to="/membros/docs">
                  Ler documentacao oficial
                  <BookKey className="h-4 w-4" />
                </Link>
              </Button>
            </section>

            <section className="rounded-[34px] border border-slate-900/10 bg-slate-950 p-6 text-slate-50 shadow-elevated sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
                Continuar com conta
              </p>
              <h2 className="mt-3 text-2xl font-bold">Login padrao Google</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Use o botao oficial do Google quando o client ID estiver configurado. Enquanto isso,
                o ambiente local continua com um fallback de demonstracao para validarmos a UX.
              </p>

              <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-5">
                <GoogleSignInButton
                  onCredential={handleGoogleCredential}
                  onFallbackDemo={handleDemoFallback}
                />
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={handleDemoFallback}
                className="mt-4 h-11 w-full rounded-full"
              >
                Entrar em modo demonstracao
              </Button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MembrosLoginPage;
