import { Card } from "@/components/ui/card";

const Clients = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-muran-dark">Clientes</h1>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Lista de Clientes</h2>
        <p className="text-gray-600">Em desenvolvimento...</p>
      </Card>
    </div>
  );
};

export default Clients;