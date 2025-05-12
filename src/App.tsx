
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "@/pages/Index";
import ImprovedDailyReviews from "@/pages/ImprovedDailyReviews";
import NewDailyReviews from "@/pages/NewDailyReviews"; 
import ClientDetails from "@/components/new-reviews/pages/ClientDetails"; 

function App() {
  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/revisao-diaria-avancada" element={<ImprovedDailyReviews />} />
          <Route path="/revisao-diaria-nova" element={<NewDailyReviews />} /> 
          <Route path="/cliente/:clientId" element={<ClientDetails />} /> 
          {/* Rotas adicionais aqui */}
        </Routes>
      </Layout>
      <Toaster />
    </>
  );
}

export default App;
