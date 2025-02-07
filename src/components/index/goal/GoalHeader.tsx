
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
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
    <CardHeader className="p-4">
      <CardTitle className="flex items-center gap-3 text-lg font-bold">
        <Trophy className="w-6 h-6 text-[#ff6e00]" />
        <div className="flex-1">
          <p>Desafio Muran</p>
          {goal && (
            <div className="flex gap-3 items-center mt-1.5">
              <div className="bg-blue-50 px-2 py-0.5 rounded-full text-xs text-blue-700">
                {format(new Date(goal.start_date), 'dd/MM/yyyy')} - {format(new Date(goal.end_date), 'dd/MM/yyyy')}
              </div>
              <div className="bg-green-50 px-2 py-0.5 rounded-full text-xs text-green-700">
                {getDaysRemaining(goal.end_date) > 0 
                  ? `${getDaysRemaining(goal.end_date)} dias restantes` 
                  : "Desafio encerrado"}
              </div>
            </div>
          )}
        </div>
        {isAdmin && !isEditing && !isCreating && goal && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto text-xs"
            onClick={onEditClick}
          >
            Editar Desafio
          </Button>
        )}
      </CardTitle>
    </CardHeader>
  );
};
