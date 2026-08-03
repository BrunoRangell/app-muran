import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientTasksTab } from "@/components/tasks/ClientTasksTab";
import { ListChecks } from "lucide-react";

const ClientTasks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get("clientId") ?? "";
  const [clientId, setClientId] = useState(initial);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-for-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, status")
        .order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const selectClient = (id: string) => {
    setClientId(id);
    setSearchParams({ clientId: id });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-muran-dark md:text-3xl">
          <ListChecks className="h-6 w-6 text-muran-primary" />
          Tarefas de Clientes
        </h1>
        <Select value={clientId} onValueChange={selectClient}>
          <SelectTrigger className="w-full md:w-72">
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="p-3 md:p-5">
        {clientId ? (
          <ClientTasksTab clientId={clientId} />
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Escolha um cliente para ver o quadro de tarefas.
          </p>
        )}
      </Card>
    </div>
  );
};

export default ClientTasks;
