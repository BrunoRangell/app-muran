import { useState } from "react";
import { Task } from "@/types/task";
import { TaskItem } from "./TaskItem";

export const TaskList = () => {
  const [tasks] = useState<Task[]>([
    {
      id: "1",
      title: "Exemplo de tarefa",
      description: "Esta é uma tarefa de exemplo",
      status: "pending",
      priority: "medium",
      dueDate: new Date().toISOString(),
    },
  ]);

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
};