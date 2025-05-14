
import { Routes, Route } from 'react-router-dom';
import RevisaoDiaria from '@/pages/RevisaoDiaria';
import ImprovedDailyReviews from '@/pages/ImprovedDailyReviews';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";

// Configuração do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<RevisaoDiaria />} />
        <Route path="/revisao-diaria" element={<RevisaoDiaria />} /> 
        <Route path="/revisao-diaria-avancada" element={<ImprovedDailyReviews />} />
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
      <Toaster />
    </QueryClientProvider>
  );
}
