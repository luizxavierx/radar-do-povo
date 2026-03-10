import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const graphqlBase =
    env.VITE_RADAR_API_BASE || "https://api.radardopovo.com/graphql";
  const devUpstreamApiBase = graphqlBase.replace(/\/graphql\/?$/, "");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api/graphql": {
          target: devUpstreamApiBase,
          changeOrigin: true,
          rewrite: () => "/graphql",
        },
        "/api/healthz": {
          target: devUpstreamApiBase,
          changeOrigin: true,
        },
        "/healthz": {
          target: devUpstreamApiBase,
          changeOrigin: true,
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
