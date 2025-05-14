
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RevisaoDiaria from '@/pages/RevisaoDiaria';
import ImprovedDailyReviews from '@/pages/ImprovedDailyReviews';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RevisaoDiaria />} />
        <Route path="/revisao-diaria" element={<RevisaoDiaria />} /> 
        <Route path="/revisao-diaria-avancada" element={<ImprovedDailyReviews />} />
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </Router>
  );
}
