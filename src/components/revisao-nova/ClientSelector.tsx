
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";

interface ClientSelectorProps {
  onClientSelect: (clientId: string) => void;
}

export function ClientSelector({ onClientSelect }: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedClientName, setSelectedClientName] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingClientId, setLoadingClientId] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, meta_account_id")
        .eq("is_active", true)
        .order("company_name");
      
      if (error) throw error;
      
      // Filtrar apenas clientes com ID do Meta Ads configurado
      const clientsWithMeta = data.filter(client => client.meta_account_id);
      setClients(clientsWithMeta);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSelect = useCallback((clientId: string, clientName: string) => {
    setSelectedClientId(clientId);
    setSelectedClientName(clientName);
    setOpen(false);
  }, []);

  const handleAnalyzeClick = useCallback(() => {
    if (!selectedClientId) return;
    
    setLoadingClientId(selectedClientId);
    onClientSelect(selectedClientId);
    
    // Limpar o estado de loading após um tempo para evitar estados de UI presos
    setTimeout(() => {
      setLoadingClientId(null);
    }, 5000);
  }, [selectedClientId, onClientSelect]);

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 items-start">
          <div className="flex-1 w-full">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando clientes...
                    </span>
                  ) : selectedClientName ? (
                    selectedClientName
                  ) : (
                    "Selecione um cliente..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                  <CommandGroup>
                    <CommandList>
                      {clients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.company_name}
                          onSelect={() => handleSelect(client.id, client.company_name)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedClientId === client.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {client.company_name}
                          {client.meta_account_id && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                              Meta ID: {client.meta_account_id}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          <Button 
            onClick={handleAnalyzeClick}
            disabled={!selectedClientId || loadingClientId === selectedClientId}
            className="bg-[#ff6e00] hover:bg-[#e56500] md:w-auto w-full"
          >
            {loadingClientId === selectedClientId ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              "Analisar"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
