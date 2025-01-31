import { SpaceList } from "@/components/tasks/SpaceList";

const Tasks = () => {
  return (
    <div className="h-screen flex">
      {/* Left sidebar for spaces/folders */}
      <div className="w-64 bg-muran-complementary/95 p-4 overflow-y-auto">
        <SpaceList />
      </div>

      {/* Main content area */}
      <div className="flex-1 bg-muran-secondary p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-muran-complementary">
              Minhas Tarefas
            </h1>
          </header>
        </div>
      </div>
    </div>
  );
};

export default Tasks;