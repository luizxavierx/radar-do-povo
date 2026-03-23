import type { ReactNode } from "react";
import {
  BookKey,
  CreditCard,
  LayoutDashboard,
  LogOut,
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
  { label: "Docs da API", path: "/membros/docs", icon: BookKey },
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

  return (
    <div>
      <AppSidebar />

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-[1180px] px-4 pb-10 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <section className="rounded-[34px] border border-white/70 bg-card/92 p-6 shadow-elevated backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  {eyebrow}
                </div>
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  {title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {intro}
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:min-w-[280px] lg:max-w-[320px]">
                {account ? (
                  <div className="rounded-[24px] border border-border/70 bg-background/85 p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          account.user.avatarUrl ||
                          "https://api.dicebear.com/9.x/initials/svg?seed=Radar%20Membro"
                        }
                        alt={account.user.name}
                        className="h-12 w-12 rounded-2xl border border-border/70 bg-white object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {account.user.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{account.user.email}</p>
                      </div>
                    </div>
                    {statusMeta ? (
                      <div
                        className={cn(
                          "mt-4 rounded-2xl border px-3 py-2 text-xs font-semibold",
                          statusMeta.badgeClassName
                        )}
                      >
                        <p>{statusMeta.label}</p>
                        <p className="mt-1 font-normal leading-5">{statusMeta.description}</p>
                      </div>
                    ) : null}
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void refreshAccount()}
                        disabled={loading}
                        className="w-full rounded-2xl"
                      >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Atualizar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void signOut()}
                        disabled={loading}
                        className="w-full rounded-2xl"
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

            <nav className="mt-6 flex flex-wrap gap-2">
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
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-border/70 bg-background/85 text-foreground hover:border-primary/20 hover:bg-muted/60"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </section>

          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default MemberPortalShell;
