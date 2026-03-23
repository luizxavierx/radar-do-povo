import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useMemberSession } from "@/contexts/MemberSessionContext";

const MemberRouteGate = ({ children }: { children: ReactNode }) => {
  const { account, bootstrapping } = useMemberSession();
  const location = useLocation();

  if (bootstrapping) {
    return (
      <div className="rounded-[28px] border border-border/70 bg-card/92 p-8 text-center shadow-card">
        <p className="text-sm text-muted-foreground">Validando sessao da area de membros...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <Navigate
        to="/membros/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  return <>{children}</>;
};

export default MemberRouteGate;
