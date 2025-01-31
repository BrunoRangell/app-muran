import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskHeader } from "@/components/tasks/TaskHeader";

const Tasks = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-muran-complementary">
        Gestão de Tarefas
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Minhas Tarefas</CardTitle>
          <TaskHeader />
        </CardHeader>
        <CardContent>
          <TaskList />
        </CardContent>
      </Card>
    </div>
  );
};

export default Tasks;