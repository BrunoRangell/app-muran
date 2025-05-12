
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "@/pages/Index";
import ImprovedDailyReviews from "@/pages/ImprovedDailyReviews";
import NewDailyReviews from "@/pages/NewDailyReviews"; // Nova página
import ClientDetails from "@/components/new-reviews/pages/ClientDetails"; // Nova página de detalhes

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/revisao-diaria-avancada" element={<ImprovedDailyReviews />} />
          <Route path="/revisao-diaria-nova" element={<NewDailyReviews />} /> {/* Nova rota */}
          <Route path="/cliente/:clientId" element={<ClientDetails />} /> {/* Nova rota para detalhes do cliente */}
          {/* Rotas adicionais aqui */}
        </Routes>
      </Layout>
      <Toaster />
    </Router>
  );
}

export default App;
