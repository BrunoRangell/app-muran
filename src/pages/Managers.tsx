import { Card } from "@/components/ui/card";
import { ManagersList } from "@/components/managers/ManagersList";

const Managers = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-muran-dark">Gestores</h1>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Lista de Gestores</h2>
        <ManagersList />
      </Card>
    </div>
  );
};

export default Managers;