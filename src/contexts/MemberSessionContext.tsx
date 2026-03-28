import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  MemberPixCharge,
  MemberPortalAccount,
  MemberPortalRotateKeyResponse,
} from "@/lib/members";
import {
  buildGoogleAuthRedirectUrl,
  createPixCharge,
  fetchMemberAccount,
  logoutMember,
  rotateMemberApiKey,
} from "@/services/memberPortalService";

type MemberSessionContextValue = {
  account: MemberPortalAccount | null;
  bootstrapping: boolean;
  loading: boolean;
  lastIssuedApiKey: MemberPortalRotateKeyResponse["issuedKey"] | null;
  startGoogleSignIn: (returnTo?: string) => void;
  signOut: () => Promise<void>;
  refreshAccount: () => Promise<MemberPortalAccount | null>;
  createCheckoutPix: () => Promise<MemberPixCharge>;
  rotateApiKey: () => Promise<MemberPortalRotateKeyResponse["issuedKey"]>;
  clearIssuedApiKey: () => void;
};

const MemberSessionContext = createContext<MemberSessionContextValue | null>(null);

export const MemberSessionProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<MemberPortalAccount | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastIssuedApiKey, setLastIssuedApiKey] =
    useState<MemberPortalRotateKeyResponse["issuedKey"] | null>(null);

  useEffect(() => {
    fetchMemberAccount()
      .then((response) => {
        setAccount(response);
      })
      .catch(() => {
        setAccount(null);
      })
      .finally(() => {
        setBootstrapping(false);
      });
  }, []);

  const value = useMemo<MemberSessionContextValue>(
    () => ({
      account,
      bootstrapping,
      loading,
      lastIssuedApiKey,
      startGoogleSignIn: (returnTo = "/membros/dashboard") => {
        setLoading(true);
        window.location.assign(buildGoogleAuthRedirectUrl(returnTo));
      },
      signOut: async () => {
        setLoading(true);
        try {
          await logoutMember();
        } finally {
          setAccount(null);
          setLastIssuedApiKey(null);
          setLoading(false);
        }
      },
      refreshAccount: async () => {
        setLoading(true);
        try {
          const response = await fetchMemberAccount();
          setAccount(response);
          return response;
        } catch (error) {
          setAccount(null);
          throw error;
        } finally {
          setLoading(false);
        }
      },
      createCheckoutPix: async () => {
        setLoading(true);
        try {
          const charge = await createPixCharge();
          const nextAccount = await fetchMemberAccount();
          setAccount(nextAccount);
          return charge;
        } finally {
          setLoading(false);
        }
      },
      rotateApiKey: async () => {
        setLoading(true);
        try {
          const response = await rotateMemberApiKey();
          setAccount(response.account);
          setLastIssuedApiKey(response.issuedKey);
          return response.issuedKey;
        } finally {
          setLoading(false);
        }
      },
      clearIssuedApiKey: () => {
        setLastIssuedApiKey(null);
      },
    }),
    [account, bootstrapping, lastIssuedApiKey, loading]
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
