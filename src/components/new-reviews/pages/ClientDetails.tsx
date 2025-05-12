
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ClientDetails() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleBack}
          className="flex items-center gap-1"
        >
          <ArrowLeft size={16} />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-[#321e32]">Detalhes do Cliente</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cliente ID: {clientId}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Esta página exibirá informações detalhadas sobre o cliente selecionado.
            Funcionalidade em desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
