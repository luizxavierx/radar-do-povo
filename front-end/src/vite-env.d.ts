/// <reference types="vite/client" />

declare const __RADAR_API_BASE__: string;
declare const __RADAR_API_KEY__: string;

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_MEMBER_API_BASE_URL?: string;
  readonly VITE_MEMBER_PIX_ENDPOINT?: string;
  readonly VITE_MEMBER_PIX_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
