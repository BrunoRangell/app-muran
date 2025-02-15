
import { SpaceList } from "@/components/tasks/SpaceList";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";
import { TaskHeader } from "@/components/tasks/TaskHeader";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Tasks = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col md:flex-row relative">
      {/* Botão de toggle do sidebar em mobile */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-2 left-2 z-50"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "w-64 bg-muran-complementary/95 p-3 md:p-4 overflow-y-auto transition-all duration-300",
          isMobile && !isSidebarOpen && "-translate-x-full absolute inset-y-0",
          isMobile && isSidebarOpen && "absolute inset-y-0 z-40"
        )}
      >
        <SpaceList />
      </div>

      {/* Conteúdo principal */}
      <div 
        className={cn(
          "flex-1 bg-muran-secondary p-3 md:p-6 overflow-y-auto",
          isMobile && isSidebarOpen && "opacity-50"
        )}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <TaskHeader />

          <Card className="p-4 md:p-8 flex flex-col items-center justify-center space-y-3 md:space-y-4">
            <Construction className="h-8 md:h-12 w-8 md:w-12 text-muran-primary animate-bounce" />
            <h2 className="text-lg md:text-2xl font-bold text-muran-complementary text-center">
              Em Desenvolvimento
            </h2>
            <p className="text-xs md:text-base text-gray-600 text-center max-w-md">
              Estamos trabalhando para trazer a melhor experiência de gestão de tarefas para você.
              Em breve, você terá acesso a todas as funcionalidades.
            </p>
          </Card>

          {/* Placeholders para funcionalidades futuras */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
