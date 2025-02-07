
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import { Goal } from "@/types/goal";

interface GoalHeaderProps {
  goal?: Goal;
  isAdmin: boolean;
  isEditing: boolean;
  isCreating: boolean;
  onEditClick: () => void;
}

export const GoalHeader = ({ goal, isAdmin, isEditing, isCreating, onEditClick }: GoalHeaderProps) => {
  return (
    <CardHeader className="p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#ff6e00]" />
          <p className="font-semibold text-sm">Desafio Muran</p>
        </div>

        {isAdmin && !isEditing && !isCreating && goal && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={onEditClick}
          >
            Editar
          </Button>
        )}
      </div>
    </CardHeader>
  );
};
