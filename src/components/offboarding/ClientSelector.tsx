import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

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

  const handleSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const selectedClient = clients.find((c) => c.id === clientId);
    onClientSelect(selectedClient || null);
    setOpen(false);
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
      <Label>Selecione o Cliente</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedClientId
              ? clients.find((client) => client.id === selectedClientId)?.company_name
              : "Escolha um cliente..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar cliente..." />
            <CommandList>
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.company_name}
                    onSelect={() => handleSelect(client.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedClientId === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {client.company_name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
