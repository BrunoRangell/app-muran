
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Client {
  id: string;
  company_name: string;
  meta_account_id: string | null;
}

interface ClientSelectorProps {
  onClientSelect: (clientId: string) => void;
}

export const ClientSelector = ({ onClientSelect }: ClientSelectorProps) => {
  const [selectedClient, setSelectedClient] = useState<string>("");

  const { data: clients, isLoading, error } = useQuery({
    queryKey: ["metaAdsClients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, meta_account_id")
        .eq("status", "active")
        .order("company_name", { ascending: true });

      if (error) throw new Error(error.message);
      
      // Filtrar apenas clientes que têm ID do Meta Ads configurado
      return (data as Client[]).filter(client => !!client.meta_account_id);
    }
  });

  useEffect(() => {
    if (selectedClient) {
      onClientSelect(selectedClient);
    }
  }, [selectedClient, onClientSelect]);

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar clientes</AlertTitle>
        <AlertDescription>{(error as Error).message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="client">Cliente</Label>
      <Select 
        value={selectedClient} 
        onValueChange={setSelectedClient}
        disabled={isLoading}
      >
        <SelectTrigger id="client" className="w-full">
          <SelectValue placeholder="Selecione um cliente" />
        </SelectTrigger>
        <SelectContent>
          {clients?.length === 0 && (
            <SelectItem value="empty" disabled>
              Nenhum cliente com Meta Ads configurado
            </SelectItem>
          )}
          {clients?.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.company_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
