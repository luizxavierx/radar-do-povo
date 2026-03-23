import { useEffect } from "react";
import { BookKey, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import AppSidebar from "@/components/AppSidebar";
import GoogleSignInButton from "@/components/members/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { useMemberSession } from "@/contexts/MemberSessionContext";
import { DEFAULT_MEMBER_PLAN } from "@/lib/members";

const MembrosLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, bootstrapping, loading, startGoogleSignIn } = useMemberSession();

  const nextPath =
    typeof location.state === "object" &&
    location.state !== null &&
    "from" in location.state &&
    typeof location.state.from === "string"
      ? location.state.from
      : "/membros/dashboard";

  useEffect(() => {
    if (!bootstrapping && account) {
      navigate(nextPath, { replace: true });
    }
  }, [account, bootstrapping, navigate, nextPath]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorMessage = params.get("erro");
    if (!errorMessage) {
      return;
    }

    toast.error(errorMessage);
    params.delete("erro");
    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : "",
      },
      { replace: true }
    );
  }, [location.pathname, location.search, navigate]);

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
                Entre para ativar checkout, plano e chave unica da API.
              </h1>
              <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                O login Google agora e validado no backend antes de abrir a sessao do portal. Isso
                reduz fraude de identidade e prepara o checkout PIX com o usuario correto.
              </p>

              <div className="mt-6 rounded-[28px] border border-border/70 bg-background/85 p-5 text-sm leading-6 text-muted-foreground">
                <p className="font-semibold text-foreground">Fluxo de producao:</p>
                <ul className="mt-3 space-y-2">
                  <li>Login Google validado server-side com audience do seu client ID.</li>
                  <li>Checkout PIX mensal de {DEFAULT_MEMBER_PLAN.priceLabel} gerado pelo Laravel.</li>
                  <li>Webhook confirma pagamento e libera o membro para gerar a API key.</li>
                </ul>
              </div>

              <Button asChild variant="outline" className="mt-4 rounded-full">
                <Link to="/membros/login" state={{ from: "/membros/docs" }}>
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
                O portal agora usa o fluxo tradicional: o navegador vai para o Google, o backend
                recebe o callback oficial e so depois devolve a sessao autenticada ao frontend.
              </p>

              <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-5">
                <GoogleSignInButton
                  onStartAuth={() => {
                    startGoogleSignIn(nextPath);
                  }}
                  disabled={loading}
                />
              </div>

              {loading ? (
                <p className="mt-4 text-sm text-slate-300">
                  Redirecionando para o Google e preparando o callback seguro...
                </p>
              ) : null}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MembrosLoginPage;
