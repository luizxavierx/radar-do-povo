import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawRadarApiBase = env.RADAR_API_BASE || "/graphql";
  const proxyTarget = (env.RADAR_PROXY_TARGET || "http://127.0.0.1:8081").trim();
  const proxySharedApiKey = (env.RADAR_SHARED_API_KEY || "").trim();

  const radarApiBase = rawRadarApiBase.replace(/\/+$/, "");
  const proxyHeaders = proxySharedApiKey ? { "X-Radar-Api-Key": proxySharedApiKey } : undefined;

  return {
    define: {
      __RADAR_API_BASE__: JSON.stringify(radarApiBase),
    },
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/graphql": {
          target: proxyTarget,
          changeOrigin: true,
          headers: proxyHeaders,
        },
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          headers: proxyHeaders,
        },
        "/healthz": {
          target: proxyTarget,
          changeOrigin: true,
          headers: proxyHeaders,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
