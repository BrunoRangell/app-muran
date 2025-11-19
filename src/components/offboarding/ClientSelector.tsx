import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Client {
  id: string;
  company_name: string;
  contact_name: string;
  contract_value: number;
  first_payment_date: string;
}

interface ClientSelectorProps {
  onClientSelect: (client: Client | null) => void;
  disabled?: boolean;
}

export const ClientSelector = ({ onClientSelect, disabled }: ClientSelectorProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveClients();
  }, []);

  const fetchActiveClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, contact_name, contract_value, first_payment_date")
        .eq("status", "active")
        .order("company_name");

      if (error) throw error;

      setClients(data || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (value: string) => {
    const selectedClient = clients.find((c) => c.id === value);
    onClientSelect(selectedClient || null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Nenhum cliente ativo encontrado
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="client-select">Selecione o Cliente</Label>
      <Select onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger id="client-select">
          <SelectValue placeholder="Escolha um cliente..." />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.company_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
