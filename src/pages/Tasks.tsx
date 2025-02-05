import { SpaceList } from "@/components/tasks/SpaceList";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

const Tasks = () => {
  return (
    <div className="h-screen flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-muran-complementary/95 p-4 overflow-y-auto">
        <SpaceList />
      </div>

      <div className="flex-1 bg-muran-secondary p-4 md:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <Card className="p-6 md:p-8 flex flex-col items-center justify-center space-y-4">
            <Construction className="h-10 md:h-12 w-10 md:w-12 text-muran-primary animate-bounce" />
            <h2 className="text-xl md:text-2xl font-bold text-muran-complementary text-center">
              Em Desenvolvimento
            </h2>
            <p className="text-sm md:text-base text-gray-600 text-center max-w-md">
              Estamos trabalhando para trazer a melhor experiência de gestão de tarefas para você.
              Em breve, você terá acesso a todas as funcionalidades.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Tasks;