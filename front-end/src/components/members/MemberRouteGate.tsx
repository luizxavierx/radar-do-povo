import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useMemberSession } from "@/contexts/MemberSessionContext";

const MemberRouteGate = ({ children }: { children: ReactNode }) => {
  const { session } = useMemberSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/membros/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export default MemberRouteGate;
