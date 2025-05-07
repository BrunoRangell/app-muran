
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "./components/layout/Layout";
import DailyReviews from "./pages/DailyReviews";
import RevisaoNova from "./pages/RevisaoNova";
import ImprovedDailyReviews from "./pages/ImprovedDailyReviews";
import { Index } from "./pages/Index";

// Criar uma instância do React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/daily-reviews" element={<DailyReviews />} />
          <Route path="/revisao-nova" element={<RevisaoNova />} />
          <Route path="/revisao-meta" element={<ImprovedDailyReviews />} />
        </Routes>
      </Layout>
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
