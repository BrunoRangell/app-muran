
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader, Play, Check } from "lucide-react";

export function AutoReviewTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const { toast } = useToast();

  const testCronFunction = async () => {
    setIsLoading(true);
    setTestSuccess(null);
    
    try {
      console.log("Testando função Edge daily-meta-review");
      
      // Chamamos a função Edge diretamente para testar
      const { data, error } = await supabase.functions.invoke("daily-meta-review", {
        body: { test: true, timestamp: new Date().toISOString() }
      });
      
      if (error) {
        console.error("Erro ao testar função:", error);
        throw new Error(`Erro ao testar função: ${error.message}`);
      }
      
      console.log("Resposta do teste:", data);
      setResult(data);
      setTestSuccess(true);
      
      toast({
        title: "Teste realizado com sucesso",
        description: "A função Edge de revisão diária está funcionando corretamente.",
      });
    } catch (error) {
      console.error("Erro ao testar função:", error);
      setResult(null);
      setTestSuccess(false);
      
      toast({
        title: "Falha no teste",
        description: error instanceof Error ? error.message : "Não foi possível testar a função Edge.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Teste de Conectividade</CardTitle>
        <CardDescription>
          Verifique se a função Edge de revisão diária está acessível
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testCronFunction} 
          disabled={isLoading}
          className="w-full bg-muran-complementary hover:bg-muran-complementary/90 text-white"
        >
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Testar Função Edge
            </>
          )}
        </Button>
        
        {testSuccess === true && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded">
            <Check size={16} />
            <span>Função Edge disponível e respondendo</span>
          </div>
        )}
        
        {testSuccess === false && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded">
            <span>Erro ao conectar com a função Edge. Verifique os logs para mais detalhes.</span>
          </div>
        )}
        
        {result && (
          <div className="text-xs bg-gray-50 p-2 rounded border border-gray-100 overflow-auto max-h-60">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          Este teste verifica se a função Edge está publicada e acessível.
        </p>
      </CardContent>
    </Card>
  );
}
