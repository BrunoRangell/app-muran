import { Task } from "@/types/task";
import { TaskItem } from "./TaskItem";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

interface TaskListProps {
  tasks: Task[];
}

export const TaskList = ({ tasks: initialTasks }: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const handleAddTask = () => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: "Nova Tarefa",
      description: "Descrição da tarefa",
      status: "pending",
      priority: "medium",
      dueDate: new Date().toISOString(),
      listId: "temp", // This should be set properly when implementing persistence
    };
    setTasks([...tasks, newTask]);
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleAddTask}
        variant="ghost"
        size="sm"
        className="text-muran-primary hover:text-muran-primary/90"
      >
        <Plus className="mr-2 h-4 w-4" />
        Nova Tarefa
      </Button>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};