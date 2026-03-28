import type { ReactNode } from "react";
import {
  ArrowRight,
  BookKey,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import AppSidebar from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { useMemberSession } from "@/contexts/MemberSessionContext";
import { getMemberStatusMeta } from "@/lib/members";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Painel", path: "/membros/dashboard", icon: LayoutDashboard },
  { label: "Checkout", path: "/membros/checkout", icon: CreditCard },
  { label: "Documentacao", path: "/membros/docs", icon: BookKey },
];

type MemberPortalShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  actions?: ReactNode;
  children: ReactNode;
};

const MemberPortalShell = ({
  eyebrow,
  title,
  intro,
  actions,
  children,
}: MemberPortalShellProps) => {
  const location = useLocation();
  const { account, loading, signOut, refreshAccount } = useMemberSession();
  const statusMeta = account ? getMemberStatusMeta(account.membership.status) : null;
  const journey = account?.journey;
  const periodLabel =
    account?.membership.currentPeriodEndsAt
      ? new Date(account.membership.currentPeriodEndsAt).toLocaleDateString("pt-BR")
      : "Sem ciclo ativo";
  const usageLabel = account?.usage
    ? `${account.usage.remaining.toLocaleString("pt-BR")} livres`
    : "Disponivel apos ativacao";
  const apiKeyLabel = account?.apiKey.exists ? account.apiKey.prefix ?? "Chave ativa" : "Pendente";

  return (
    <div>
      <AppSidebar />

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-[1220px] px-4 pb-12 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-card/95 p-6 shadow-elevated backdrop-blur-sm sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.16),transparent_34%),radial-gradient(circle_at_center_right,rgba(37,99,235,0.12),transparent_38%)]" />

            <div className="relative">
              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {eyebrow}
                  </div>
                  <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                    {intro}
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[24px] border border-border/70 bg-white/85 px-4 py-4 shadow-card">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Plano
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {account?.membership.planName ?? "Radar do Povo Membros"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {account?.membership.priceLabel ?? "R$ 15/mensal"}
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-border/70 bg-white/85 px-4 py-4 shadow-card">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Cota atual
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{usageLabel}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        No ciclo exibido no painel
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-border/70 bg-white/85 px-4 py-4 shadow-card">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Chave da API
                      </p>
                      <p className="mt-2 truncate text-sm font-semibold text-foreground">
                        {apiKeyLabel}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Uma chave ativa por conta
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {account ? (
                    <div className="rounded-[28px] border border-slate-900/10 bg-slate-950 p-5 text-slate-50 shadow-card">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            account.user.avatarUrl ||
                            "https://api.dicebear.com/9.x/initials/svg?seed=Radar%20Membro"
                          }
                          alt={account.user.name}
                          className="h-14 w-14 rounded-[20px] border border-white/10 bg-white object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{account.user.name}</p>
                          <p className="truncate text-xs text-slate-300">{account.user.email}</p>
                        </div>
                      </div>

                      {statusMeta ? (
                        <div
                          className={cn(
                            "mt-4 rounded-[20px] border px-3 py-3 text-xs",
                            statusMeta.badgeClassName
                          )}
                        >
                          <p className="font-semibold">{statusMeta.label}</p>
                          <p className="mt-1 leading-5 opacity-90">{statusMeta.description}</p>
                        </div>
                      ) : null}

                      {journey ? (
                        <div className="mt-4 rounded-[22px] border border-white/10 bg-white/5 p-4">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
                            Etapa atual
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">{journey.title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {journey.description}
                          </p>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-3">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
                                Ciclo atual
                              </p>
                              <p className="mt-2 text-sm font-semibold">{periodLabel}</p>
                            </div>
                            <div className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-3">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
                                Conta
                              </p>
                              <p className="mt-2 text-sm font-semibold capitalize">
                                {account.user.status}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {journey.steps.map((step, index) => (
                              <span
                                key={step.key}
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold",
                                  step.complete
                                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                                    : step.current
                                      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                                      : "border-white/10 bg-white/5 text-slate-300"
                                )}
                              >
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px]">
                                  {index + 1}
                                </span>
                                {step.label}
                              </span>
                            ))}
                          </div>

                          <Button
                            asChild
                            className="mt-4 h-11 w-full rounded-2xl bg-white text-slate-950 hover:bg-slate-100"
                          >
                            <Link to={journey.primaryAction.href}>
                              {journey.primaryAction.label}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void refreshAccount()}
                          disabled={loading}
                          className="w-full rounded-2xl border-white/15 bg-white/5 text-slate-50 hover:bg-white/10 hover:text-slate-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                          Atualizar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void signOut()}
                          disabled={loading}
                          className="w-full rounded-2xl border-white/15 bg-white/5 text-slate-50 hover:bg-white/10 hover:text-slate-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Sair
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {actions}
                </div>
              </div>

              <nav className="mt-8 flex flex-wrap gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                        active
                          ? "border-primary/20 bg-primary/10 text-primary shadow-sm"
                          : "border-border/70 bg-white/85 text-foreground hover:border-primary/20 hover:bg-muted/60"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </section>

          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default MemberPortalShell;
