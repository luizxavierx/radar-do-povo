import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { MemberPixCharge, MemberSession } from "@/lib/members";
import {
  clearStoredMemberSession,
  clearStoredPixCharge,
  createPixCharge as createPixChargeRequest,
  getStoredMemberSession,
  getStoredPixCharge,
  signInDemoMember,
  signInWithGoogleCredential,
  updateStoredMemberSession,
} from "@/services/memberPortalService";

type MemberSessionContextValue = {
  session: MemberSession | null;
  pixCharge: MemberPixCharge | null;
  signInFromGoogle: (credential: string) => MemberSession;
  signInDemo: () => MemberSession;
  signOut: () => void;
  createPixCharge: (input: { payerName?: string | null; payerEmail?: string | null }) => Promise<MemberPixCharge>;
  clearPixCharge: () => void;
};

const MemberSessionContext = createContext<MemberSessionContextValue | null>(null);

export const MemberSessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<MemberSession | null>(null);
  const [pixCharge, setPixCharge] = useState<MemberPixCharge | null>(null);

  useEffect(() => {
    setSession(getStoredMemberSession());
    setPixCharge(getStoredPixCharge());
  }, []);

  const value = useMemo<MemberSessionContextValue>(
    () => ({
      session,
      pixCharge,
      signInFromGoogle: (credential: string) => {
        const nextSession = signInWithGoogleCredential(credential);
        setSession(nextSession);
        return nextSession;
      },
      signInDemo: () => {
        const nextSession = signInDemoMember();
        setSession(nextSession);
        return nextSession;
      },
      signOut: () => {
        clearStoredMemberSession();
        clearStoredPixCharge();
        setSession(null);
        setPixCharge(null);
      },
      createPixCharge: async (input) => {
        const charge = await createPixChargeRequest(input);
        setPixCharge(charge);

        if (session && session.membershipStatus !== "active") {
          const nextSession = updateStoredMemberSession((current) => ({
            ...current,
            membershipStatus: "awaiting_payment",
          }));

          if (nextSession) {
            setSession(nextSession);
          }
        }

        return charge;
      },
      clearPixCharge: () => {
        clearStoredPixCharge();
        setPixCharge(null);

        if (session && session.membershipStatus === "awaiting_payment") {
          const nextSession = updateStoredMemberSession((current) => ({
            ...current,
            membershipStatus: "pending_checkout",
          }));

          if (nextSession) {
            setSession(nextSession);
          }
        }
      },
    }),
    [pixCharge, session]
  );

  return <MemberSessionContext.Provider value={value}>{children}</MemberSessionContext.Provider>;
};

export const useMemberSession = () => {
  const context = useContext(MemberSessionContext);

  if (!context) {
    throw new Error("useMemberSession deve ser usado dentro de MemberSessionProvider.");
  }

  return context;
};
