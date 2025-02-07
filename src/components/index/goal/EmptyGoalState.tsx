
import { Trophy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyGoalStateProps {
  isAdmin: boolean;
  onCreateClick: () => void;
}

export const EmptyGoalState = ({ isAdmin, onCreateClick }: EmptyGoalStateProps) => {
  return (
    <div className="text-center py-4">
      <Trophy className="w-8 h-8 mx-auto text-gray-300 mb-2" />
      <p className="text-sm text-gray-600 mb-3">Nenhum desafio ativo</p>
      {isAdmin && (
        <Button
          onClick={onCreateClick}
          className="w-full max-w-xs mx-auto h-8 bg-[#ff6e00] hover:bg-[#e66200]"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Criar Desafio
        </Button>
      )}
    </div>
  );
};
