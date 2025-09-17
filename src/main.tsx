
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos - reduzido para melhor reatividade
      gcTime: 1000 * 60 * 15, // 15 minutos - reduzido para economia de memória
      refetchOnWindowFocus: true,
      refetchOnMount: 'always', // Sempre refetch ao montar
      refetchOnReconnect: true,
      networkMode: 'offlineFirst', // Melhor comportamento offline
      retry: (failureCount, error: any) => {
        // Não tentar novamente para erros de autenticação
        if (error?.message?.includes('auth') || 
            error?.message?.includes('401') ||
            error?.message?.includes('403')) {
          return false;
        }
        return failureCount < 2; // Reduzido para 2 tentativas
      },
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000), // Delays menores
    },
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
