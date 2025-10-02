
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar React e React Router em chunks próprios
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Separar bibliotecas de UI em chunks próprios
          'ui-vendor': ['@radix-ui/react-avatar', '@radix-ui/react-slot', '@radix-ui/react-toast'],
          // Separar Supabase em chunk próprio
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
    // Aumentar limite de warning de chunk size
    chunkSizeWarningLimit: 600,
    // Otimizar CSS para reduzir bloqueio de renderização
    cssCodeSplit: true,
    // Usar esbuild (padrão) para minificação - mais rápido que terser
    minify: 'esbuild',
  },
  css: {
    devSourcemap: false,
  },
}));
