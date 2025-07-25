
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

// Configuração mais robusta do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      networkMode: 'online',
    },
    mutations: {
      retry: 2,
      networkMode: 'online',
    },
  },
});

// Debug logging para React Query
queryClient.setQueryDefaults(['clients'], {
  onError: (error) => {
    console.error('❌ [QueryClient] Erro na query de clientes:', error);
  },
  onSuccess: (data) => {
    console.log('✅ [QueryClient] Query de clientes executada com sucesso:', data?.length || 0);
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
