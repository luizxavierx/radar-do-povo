import { useEffect } from "react";
import { ArrowRight, BookKey, CreditCard, KeyRound, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import AppSidebar from "@/components/AppSidebar";
import GoogleSignInButton from "@/components/members/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { useMemberSession } from "@/contexts/MemberSessionContext";
import { DEFAULT_MEMBER_PLAN, MEMBER_PIX_EXPIRATION_MINUTES } from "@/lib/members";

const accessSteps = [
  "Entrar com a conta Google que vai administrar o acesso.",
  `Gerar o checkout PIX do plano mensal dentro do portal, com validade de ${MEMBER_PIX_EXPIRATION_MINUTES} minutos.`,
  "Ativar a conta e emitir sua chave individual da API.",
];

const loginBenefits = [
  {
    icon: ShieldCheck,
    title: "Autenticacao clara",
    description: "Seu acesso fica vinculado a uma conta de identidade conhecida.",
  },
  {
    icon: CreditCard,
    title: "Billing no mesmo fluxo",
    description: "Checkout, pagamento e liberacao do plano ficam no painel, com PIX de curta validade.",
  },
  {
    icon: KeyRound,
    title: "Integracao sem ruido",
    description: "A chave da API aparece no momento certo, dentro da conta certa.",
  },
];

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
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[1100px] items-center px-4 pb-12 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <div className="grid w-full gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <section className="rounded-[34px] border border-white/70 bg-card/95 p-6 shadow-elevated sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Acesso do membro
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Entre na sua area para ativar a assinatura e administrar a API.
              </h1>
              <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                O portal foi desenhado para ser direto: autenticacao, pagamento, uso mensal e chave
                da API no mesmo fluxo.
              </p>

              <div className="mt-6 rounded-[28px] border border-border/70 bg-background/85 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Jornada do acesso
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  {accessSteps.map((item, index) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-full border border-border/70 bg-background/85 px-4 py-2 text-sm font-medium text-foreground">
                  {DEFAULT_MEMBER_PLAN.priceLabel}
                </div>
                <div className="rounded-full border border-border/70 bg-background/85 px-4 py-2 text-sm font-medium text-foreground">
                  Ate {DEFAULT_MEMBER_PLAN.monthlyRequestLimit.toLocaleString("pt-BR")} requests por mes
                </div>
                <div className="rounded-full border border-border/70 bg-background/85 px-4 py-2 text-sm font-medium text-foreground">
                  PIX valido por {MEMBER_PIX_EXPIRATION_MINUTES} minutos
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {loginBenefits.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[24px] border border-border/70 bg-white/88 px-4 py-4 shadow-card"
                  >
                    <div className="inline-flex rounded-2xl bg-primary/10 p-2.5 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>

              <Button asChild variant="outline" className="mt-5 rounded-full">
                <Link to="/membros/login" state={{ from: "/membros/docs" }}>
                  Ler documentacao oficial
                  <BookKey className="h-4 w-4" />
                </Link>
              </Button>
            </section>

            <section className="overflow-hidden rounded-[34px] border border-slate-900/10 bg-slate-950 text-slate-50 shadow-elevated">
              <div className="border-b border-white/10 p-6 sm:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                  Continuar com conta
                </p>
                <h2 className="mt-3 text-2xl font-bold">Login padrao Google</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Voce sera redirecionado ao Google e, depois da confirmacao, retorna direto ao
                  painel ja autenticado.
                </p>
              </div>

              <div className="p-6 sm:p-8">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                  <GoogleSignInButton
                    onStartAuth={() => {
                      startGoogleSignIn(nextPath);
                    }}
                    disabled={loading}
                  />

                  {loading ? (
                    <p className="mt-4 text-sm text-slate-300">
                      Preparando o redirecionamento seguro para concluir o login.
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <div className="inline-flex rounded-2xl bg-white/10 p-2.5 text-slate-100">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <p className="mt-3 text-sm font-semibold">Sessao segura</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      O backend conclui o callback e abre sua sessao no portal.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <div className="inline-flex rounded-2xl bg-white/10 p-2.5 text-slate-100">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <p className="mt-3 text-sm font-semibold">Checkout no painel</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Assim que entrar, voce acompanha assinatura, PIX, validade da cobranca e
                      liberacao da chave.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                    Retorno da sessao
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Depois do login, o portal volta para{" "}
                    <span className="font-semibold text-white">
                      {nextPath === "/membros/dashboard" ? "o dashboard" : nextPath}
                    </span>
                    .
                    <ArrowRight className="ml-2 inline h-4 w-4" />
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MembrosLoginPage;
