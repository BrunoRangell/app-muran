import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ClientSelectorProps {
  selectedClientId: string;
  onClientSelect: (clientId: string) => void;
}

export const ClientSelector = ({ selectedClientId, onClientSelect }: ClientSelectorProps) => {
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, status")
        .order("company_name");

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Cliente</Label>
        <div className="flex items-center gap-2 p-3 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando clientes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="client-select">Selecione o Cliente</Label>
      <Select value={selectedClientId} onValueChange={onClientSelect}>
        <SelectTrigger id="client-select">
          <SelectValue placeholder="Escolha um cliente..." />
        </SelectTrigger>
        <SelectContent>
          {clients?.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.company_name} {client.status === "inactive" && "(Inativo)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
