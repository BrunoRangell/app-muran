import { Task } from "@/types/task";
import { Calendar, Flag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskItemProps {
  task: Task;
}

export const TaskItem = ({ task }: TaskItemProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <Checkbox />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
          <Flag className={`h-4 w-4 ${getPriorityColor(task.priority)}`} />
        </div>
        <p className="mt-1 text-sm text-gray-500">{task.description}</p>
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <Calendar className="h-4 w-4 mr-1" />
          {format(new Date(task.dueDate), "dd 'de' MMMM", { locale: ptBR })}
        </div>
      </div>
    </div>
  );
};