import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEdgeFunction } from "@/components/daily-reviews/hooks/useEdgeFunction";
import { useToast } from "@/hooks/use-toast";

export const TestFundingDetection = () => {
  const { callFunction, isLoading } = useEdgeFunction();
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<string>("");

  const testClients = [
    { id: "da408e44-2647-48b3-83b3-9d6b9c4db4ab", name: "Juliana Lenz", accountId: "act_258374395797980" },
    { id: "61d79fd1-c6ff-4bb8-b62e-a35b1c46f9fe", name: "Megha Imóveis", accountId: "act_473892373733066" },
    { id: "e87c2e15-3c09-4ba4-8b84-da8e9f9f8b3c", name: "Dresscode", accountId: "act_486542642469508" }
  ];

  const handleTestReview = async (clientId: string, clientName: string) => {
    try {
      console.log(`🧪 [DEBUG] Iniciando teste de revisão individual para ${clientName} (${clientId})`);
      setSelectedClient(clientId);
      
      const result = await callFunction(clientId);
      
      console.log(`✅ [DEBUG] Revisão concluída para ${clientName}:`, result);
      
      toast({
        title: "Teste concluído",
        description: `Revisão executada para ${clientName}. Verifique os logs da edge function.`,
      });
    } catch (error) {
      console.error(`❌ [DEBUG] Erro no teste para ${clientName}:`, error);
      
      toast({
        title: "Erro no teste",
        description: `Falha ao executar revisão para ${clientName}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      setSelectedClient("");
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-background">
      <h3 className="text-lg font-semibold mb-4">🧪 Teste de Detecção de Funding</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Teste para forçar revisões individuais e verificar se a detecção de funding_event_successful está funcionando.
      </p>
      
      <div className="space-y-3">
        {testClients.map((client) => (
          <div key={client.id} className="flex items-center justify-between p-3 border rounded">
            <div>
              <p className="font-medium">{client.name}</p>
              <p className="text-sm text-muted-foreground">Account: {client.accountId}</p>
            </div>
            <Button
              onClick={() => handleTestReview(client.id, client.name)}
              disabled={isLoading}
              size="sm"
              variant={selectedClient === client.id ? "default" : "outline"}
            >
              {selectedClient === client.id ? "Executando..." : "Testar Revisão"}
            </Button>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-muted rounded text-sm">
        <p><strong>Como usar:</strong></p>
        <p>1. Clique em "Testar Revisão" para um cliente</p>
        <p>2. Aguarde a conclusão</p>
        <p>3. Verifique os logs da edge function para ver se funding_event_successful foi detectado</p>
        <p>4. Verifique se last_funding_detected_at foi atualizado no banco</p>
      </div>
    </div>
  );
};