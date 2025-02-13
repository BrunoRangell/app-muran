
import { Card } from "@/components/ui/card";
import { ClientsList } from "@/components/clients/ClientsList";
import { useState } from "react";

const Clients = () => {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'retention'>('revenue');

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
          Lista de Clientes
        </h1>
      </div>

      <Card className="p-2 md:p-6">
        <ClientsList rankingMetric={selectedMetric} />
      </Card>
    </div>
  );
};

export default Clients;
