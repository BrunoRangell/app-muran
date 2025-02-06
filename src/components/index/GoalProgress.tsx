import { Progress } from "@/components/ui/progress";
import { Goal, GOAL_TYPES } from "@/types/goal";
import { format } from "date-fns";

interface GoalProgressProps {
  goal: Goal;
  currentValue: number;
}

export const GoalProgress = ({ goal, currentValue }: GoalProgressProps) => {
  const progress = Math.min(
    Math.round((currentValue / goal.target_value) * 100),
    100
  );

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{GOAL_TYPES[goal.goal_type]}</h3>
      <p className="text-sm text-gray-600">
        {format(new Date(goal.start_date), 'dd/MM')} até{" "}
        {format(new Date(goal.end_date), 'dd/MM')}
      </p>
      <div className="space-y-2">
        <Progress value={progress} />
        <p className="text-sm text-gray-600 text-right">{progress}% concluído</p>
      </div>
      <p className="text-sm">
        <span className="font-medium">
          {currentValue}
        </span>{" "}
        / {goal.target_value}
      </p>
    </div>
  );
};