
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Eye, EyeOff, Check, X, RefreshCw, List } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Token {
  name: string;
  value: string;
  status: "valid" | "invalid" | "unknown" | "loading";
}

interface GoogleAdsClient {
  id: string;
  name: string;
}

export const GoogleAdsTokenTest = () => {
  const [showTokenValues, setShowTokenValues] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clients, setClients] = useState<GoogleAdsClient[]>([]);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("api_tokens")
        .select("name, value")
        .or('name.eq.google_ads_access_token,name.eq.google_ads_refresh_token,name.eq.google_ads_client_id,name.eq.google_ads_client_secret,name.eq.google_ads_developer_token,name.eq.google_ads_manager_id');

      if (error) {
        console.error("Erro ao buscar tokens:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os tokens do Google Ads",
          variant: "destructive",
        });
        return;
      }

      const tokenStatuses: { [key: string]: "valid" | "invalid" | "unknown" } = {
        google_ads_access_token: "unknown",
        google_ads_refresh_token: "unknown",
        google_ads_client_id: "unknown",
        google_ads_client_secret: "unknown",
        google_ads_developer_token: "unknown",
        google_ads_manager_id: "unknown",
      };

      // Verificar quais tokens estão disponíveis
      data?.forEach((token) => {
        if (token.value && token.value.length > 0) {
          tokenStatuses[token.name] = "valid";
        } else {
          tokenStatuses[token.name] = "invalid";
        }
      });

      // Criar array de tokens para exibição
      const formattedTokens = Object.entries(tokenStatuses).map(([name, status]) => {
        const tokenData = data?.find(t => t.name === name);
        return {
          name,
          value: tokenData?.value || "",
          status,
        };
      });

      setTokens(formattedTokens);
    } catch (err) {
      console.error("Erro ao processar tokens:", err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar os tokens",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTokenVisibility = () => {
    setShowTokenValues(!showTokenValues);
  };

  const testGoogleAdsTokens = async () => {
    setIsRefreshing(true);
    setTestResult(null);
    setClients([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-token-check');
      
      if (error) {
        console.error("Erro ao verificar tokens:", error);
        setTestResult({
          success: false,
          message: `Erro ao verificar tokens: ${error.message}`,
        });
        toast({
          title: "Erro",
          description: "Não foi possível verificar os tokens do Google Ads",
          variant: "destructive",
        });
        return;
      }
      
      if (data.error) {
        setTestResult({
          success: false,
          message: data.error,
          details: data.details || {},
        });
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
      } else {
        setTestResult({
          success: true,
          message: data.message || "Tokens verificados com sucesso",
          details: {
            apiAccess: data.apiAccess,
            clientsCount: data.clientsCount,
            tokenRefreshed: data.tokenRefreshed
          },
        });
        
        // Se houver clientes na resposta, armazenar para exibição
        if (data.clients && Array.isArray(data.clients)) {
          setClients(data.clients);
        }
        
        toast({
          title: "Sucesso",
          description: data.message || "Tokens verificados com sucesso",
        });
        
        // Atualizar tokens após renovação bem-sucedida
        if (data.tokenRefreshed) {
          fetchTokens();
        }
      }
    } catch (err) {
      console.error("Erro ao testar tokens:", err);
      setTestResult({
        success: false,
        message: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}`,
      });
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao testar os tokens",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium">Tokens configurados</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleTokenVisibility}
          className="h-8"
        >
          {showTokenValues ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" />
              Esconder valores
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Mostrar valores
            </>
          )}
        </Button>
      </div>

      <div className="mb-4">
        <Button 
          onClick={testGoogleAdsTokens} 
          disabled={isRefreshing}
          className="bg-[#ff6e00] hover:bg-[#cc5800]"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> 
              Verificando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" /> 
              Verificar e Renovar Tokens
            </>
          )}
        </Button>
      </div>

      {testResult && (
        <Alert className={`mb-4 ${testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          {testResult.success ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
          <AlertTitle className={testResult.success ? "text-green-800" : "text-red-800"}>
            {testResult.success ? "Operação bem-sucedida" : "Erro na operação"}
          </AlertTitle>
          <AlertDescription className={testResult.success ? "text-green-700" : "text-red-700"}>
            {testResult.message}
            
            {testResult.success && testResult.details && (
              <div className="mt-2 text-sm">
                {testResult.details.tokenRefreshed && <div>✓ Token de acesso renovado</div>}
                {testResult.details.apiAccess && <div>✓ API Google Ads acessível</div>}
                {testResult.details.clientsCount && (
                  <div>✓ {testResult.details.clientsCount} contas de cliente encontradas</div>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Exibir clientes retornados da API */}
      {clients.length > 0 && (
        <Accordion type="single" collapsible className="w-full bg-white border rounded-md">
          <AccordionItem value="clients">
            <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">
              <div className="flex items-center">
                <List className="h-4 w-4 mr-2 text-[#ff6e00]" />
                <span>
                  Contas Google Ads encontradas ({clients.length})
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t">
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID da Conta</TableHead>
                      <TableHead>Nome da Conta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-mono text-sm">{client.id}</TableCell>
                        <TableCell>{client.name || "Sem nome"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <div className="border rounded-md overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Token</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.name}>
                  <TableCell className="font-mono text-sm">{token.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {showTokenValues ? 
                      (token.value ? token.value : "Não configurado") : 
                      (token.value ? "••••••••••••••••••••••" : "Não configurado")}
                  </TableCell>
                  <TableCell>
                    {token.status === "valid" ? (
                      <div className="flex items-center text-green-600">
                        <Check className="h-4 w-4 mr-1" /> Configurado
                      </div>
                    ) : token.status === "invalid" ? (
                      <div className="flex items-center text-red-600">
                        <X className="h-4 w-4 mr-1" /> Não configurado
                      </div>
                    ) : token.status === "loading" ? (
                      <div className="flex items-center text-yellow-600">
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Verificando
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-600">
                        ? Desconhecido
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
