import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: "0.0.0.0",
      strictPort: false,
      cors: true,
      hmr: {
        host: "localhost"
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "es2020",
      },
    },
    build: {
      target: "es2020",
      outDir: "dist",
      sourcemap: true
    },
    preview: {
      port: 3000,
      host: "0.0.0.0"
    },
    base: "/",
    define: {
      "process.env": env
    }
  };
});
