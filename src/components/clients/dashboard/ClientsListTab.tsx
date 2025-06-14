
import { Card } from "@/components/ui/card";
import { ClientsList } from "../ClientsList";

export const ClientsListTab = () => {
  return (
    <Card className="border border-gray-100 shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-muran-dark">Lista de Clientes</h2>
            <p className="text-gray-600 text-sm">Gerencie e visualize todos os seus clientes</p>
          </div>
        </div>
        
        <ClientsList />
      </div>
    </Card>
  );
};
