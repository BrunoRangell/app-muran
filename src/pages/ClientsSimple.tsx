import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  company_name: string;
  contract_value: number;
  status: string;
  first_payment_date: string;
  acquisition_channel?: string;
  contact_name?: string;
  contact_phone?: string;
}

const ClientsSimple = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("status", "active")
        .order("company_name");

      if (error) {
        throw new Error("Erro ao carregar clientes");
      }

      setClients(data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMsg);
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
          Lista de Clientes
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
        <div className="flex flex-col items-center justify-center p-8 text-red-500 gap-4">
          <AlertCircle className="h-12 w-12" />
          <h2 className="text-xl font-semibold">Erro ao carregar dados</h2>
          <p className="text-center text-gray-600">{error}</p>
          <Button onClick={loadClients} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
          Lista de Clientes ({clients.length})
        </h1>
        <Button className="bg-muran-primary hover:bg-muran-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <Card key={client.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-muran-dark">
                {client.company_name}
              </h3>
              <p className="text-sm text-gray-600">
                Valor: R$ {client.contract_value?.toLocaleString('pt-BR') || '0'}
              </p>
              {client.contact_name && (
                <p className="text-sm text-gray-600">
                  Contato: {client.contact_name}
                </p>
              )}
              {client.contact_phone && (
                <p className="text-sm text-gray-600">
                  Telefone: {client.contact_phone}
                </p>
              )}
              {client.acquisition_channel && (
                <p className="text-sm text-gray-600">
                  Canal: {client.acquisition_channel}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Início: {new Date(client.first_payment_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum cliente ativo encontrado.</p>
        </div>
      )}
    </div>
  );
};

export default ClientsSimple;