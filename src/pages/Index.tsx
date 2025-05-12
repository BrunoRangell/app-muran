
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirecionar para o dashboard de revisão diária avançada
    navigate('/revisao-diaria-avancada');
  }, [navigate]);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-[#321e32]">
        Redirecionando...
      </h1>
    </div>
  );
}
