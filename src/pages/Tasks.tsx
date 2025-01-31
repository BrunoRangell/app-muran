import { Card, CardContent } from "@/components/ui/card";
import { SpaceList } from "@/components/tasks/SpaceList";

const Tasks = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-muran-complementary">
        Gestão de Tarefas
      </h1>

      <Card>
        <CardContent className="pt-6">
          <SpaceList />
        </CardContent>
      </Card>
    </div>
  );
};

export default Tasks;