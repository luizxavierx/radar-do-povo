/// <reference types="vite/client" />

declare const __RADAR_API_BASE__: string;

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_MEMBER_API_BASE_URL?: string;
  readonly VITE_MEMBER_PORTAL_BASE_URL?: string;
  readonly VITE_MEMBER_PORTAL_DEMO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
