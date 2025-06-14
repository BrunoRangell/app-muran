
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { TaskForm } from "@/components/tasks/TaskForm";

export const TaskHeader = () => {
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);

  return (
    <div className="flex justify-between items-center mt-2">
      <div className="space-x-2">
        <Button
          onClick={() => setShowNewTaskForm(true)}
          className="bg-muran-primary hover:bg-muran-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
        </Button>
      </div>
      {showNewTaskForm && (
        <TaskForm onClose={() => setShowNewTaskForm(false)} />
      )}
    </div>
  );
};
