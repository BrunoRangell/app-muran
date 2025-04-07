
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader, Play, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DebugTools() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  // Função para verificar diretamente a Edge Function
  const testEdgeDirectly = async () => {
    setIsLoading(true);
    try {
      // Obter sessão para autenticação
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Sessão não encontrada. Por favor, faça login novamente");
      }
      
      // Chamada direta via fetch para testar
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-meta-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          test: true,
          method: "ping",
          timestamp: new Date().toISOString()
        })
      });
      
      let data;
      try {
        data = await response.json();
      } catch (err) {
        const text = await response.text();
        throw new Error(`Erro ao parsear resposta: ${text}`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${JSON.stringify(data)}`);
      }
      
      setResult({
        status: response.status,
        data,
        headers: Object.fromEntries([...response.headers.entries()])
      });
      
      toast({
        title: "Teste direto bem-sucedido",
        description: "A função Edge respondeu corretamente.",
      });
    } catch (error) {
      console.error("Erro ao testar função Edge diretamente:", error);
      setResult({ error: error instanceof Error ? error.message : String(error) });
      
      toast({
        title: "Falha no teste direto",
        description: error instanceof Error ? error.message : "Não foi possível testar a função Edge diretamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Ferramentas de Diagnóstico Avançado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle>Ferramentas para Suporte Técnico</AlertTitle>
          <AlertDescription className="text-xs">
            Use estas ferramentas apenas quando orientado pela equipe de suporte para diagnosticar problemas de conectividade.
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={testEdgeDirectly} 
          disabled={isLoading}
          className="w-full bg-muran-complementary hover:bg-muran-complementary/90 text-white"
        >
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Testando diretamente...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Verificar Edge Function Diretamente
            </>
          )}
        </Button>
        
        {result && (
          <div className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-60">
            <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
