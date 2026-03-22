import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawRadarApiBase = env.RADAR_API_BASE;
  const radarApiKey = env.RADAR_API_KEY;
  if (!rawRadarApiBase) {
    throw new Error("Missing env: RADAR_API_BASE");
  }
  if (!radarApiKey) {
    throw new Error("Missing env: RADAR_API_KEY");
  }

  const radarApiBase = rawRadarApiBase.replace(/\/+$/, "");

  return {
    define: {
      __RADAR_API_BASE__: JSON.stringify(radarApiBase),
      __RADAR_API_KEY__: JSON.stringify(radarApiKey),
    },
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
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
