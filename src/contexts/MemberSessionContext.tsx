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
  clearStoredPortalToken,
  createPixCharge,
  fetchMemberAccount,
  getStoredPortalToken,
  logoutMember,
  rotateMemberApiKey,
  signInWithGoogleCredential,
} from "@/services/memberPortalService";

type MemberSessionContextValue = {
  account: MemberPortalAccount | null;
  bootstrapping: boolean;
  loading: boolean;
  lastIssuedApiKey: MemberPortalRotateKeyResponse["issuedKey"] | null;
  signInFromGoogle: (credential: string) => Promise<MemberPortalAccount>;
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
    const token = getStoredPortalToken();
    if (!token) {
      setBootstrapping(false);
      return;
    }

    fetchMemberAccount()
      .then((response) => {
        setAccount(response);
      })
      .catch(() => {
        clearStoredPortalToken();
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
      signInFromGoogle: async (credential: string) => {
        setLoading(true);
        try {
          const response = await signInWithGoogleCredential(credential);
          setLastIssuedApiKey(null);
          setAccount(response.account);
          return response.account;
        } finally {
          setLoading(false);
        }
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
        if (!getStoredPortalToken()) {
          setAccount(null);
          return null;
        }

        setLoading(true);
        try {
          const response = await fetchMemberAccount();
          setAccount(response);
          return response;
        } catch (error) {
          clearStoredPortalToken();
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
