
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import { format, getDaysRemaining } from "../goal/goalUtils";
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
    <CardHeader className="p-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-[#ff6e00]" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">Desafio Muran</p>
          {goal && (
            <div className="flex gap-2 items-center mt-1 text-xs">
              <span className="text-gray-600">
                {format(new Date(goal.start_date), 'dd/MM')} - {format(new Date(goal.end_date), 'dd/MM')}
              </span>
              <span className="text-green-600">
                {getDaysRemaining(goal.end_date) > 0 
                  ? `${getDaysRemaining(goal.end_date)} dias restantes` 
                  : "Encerrado"}
              </span>
            </div>
          )}
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
