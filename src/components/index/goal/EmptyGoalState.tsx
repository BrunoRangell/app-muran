
import { Trophy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyGoalStateProps {
  isAdmin: boolean;
  onCreateClick: () => void;
}

export const EmptyGoalState = ({ isAdmin, onCreateClick }: EmptyGoalStateProps) => {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="space-y-2">
        <Trophy className="w-12 h-12 mx-auto text-gray-300" />
        <p className="text-gray-600">Nenhum desafio ativo</p>
      </div>
      {isAdmin && (
        <Button
          onClick={onCreateClick}
          className="w-full max-w-xs mx-auto bg-[#ff6e00] hover:bg-[#e66200]"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Criar Novo Desafio
        </Button>
      )}
    </div>
  );
};
