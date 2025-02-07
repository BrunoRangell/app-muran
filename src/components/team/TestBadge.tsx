
import { useBadges } from "@/hooks/useBadges";
import { Button } from "@/components/ui/button";

export const TestBadge = () => {
  const { addBadge } = useBadges("1"); // Assumindo que o ID do Bruno é "1" - ajuste conforme necessário

  const handleAddTestBadge = () => {
    addBadge({
      code: "sales_champion",
      name: "Campeão de Vendas",
      icon: "trophy",
      description: "Reconhecimento por excelente desempenho em vendas",
      team_member_id: "1" // Ajuste este ID para o ID correto do Bruno
    });
  };

  return (
    <Button 
      onClick={handleAddTestBadge}
      variant="outline"
      className="absolute top-4 right-4"
    >
      Adicionar Emblema de Teste
    </Button>
  );
};
