
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
    <CardHeader className="p-6 pb-4">
      <CardTitle className="flex items-center gap-3 text-xl font-bold">
        <Trophy className="w-7 h-7 text-[#ff6e00]" />
        <div className="flex-1">
          <p>Desafio Muran</p>
          {goal && (
            <div className="flex gap-4 items-center mt-2">
              <div className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800">
                {format(new Date(goal.start_date), 'dd/MM/yyyy')} - {format(new Date(goal.end_date), 'dd/MM/yyyy')}
              </div>
              <div className="bg-green-100 px-3 py-1 rounded-full text-sm text-green-800">
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
            className="ml-auto"
            onClick={onEditClick}
          >
            Editar Desafio
          </Button>
        )}
      </CardTitle>
    </CardHeader>
  );
};
