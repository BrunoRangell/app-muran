
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      apiAccess: boolean;
      tokenRefreshed: boolean;
    }
  } | null>(null);

  const { toast } = useToast();

  // Carregar tokens ao montar o componente
  useEffect(() => {
    fetchTokens();
  }, []);

  // Buscar tokens do banco de dados
  const fetchTokens = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('api_tokens')
        .select('name, value')
        .or('name.eq.google_ads_access_token,name.eq.google_ads_refresh_token,name.eq.google_ads_client_id,name.eq.google_ads_client_secret,name.eq.google_ads_developer_token,name.eq.google_ads_manager_id');
      
      if (error) {
        throw error;
      }

      const formattedTokens: Token[] = [
        {
          name: 'google_ads_access_token',
          value: '',
          status: 'unknown'
        },
        {
          name: 'google_ads_refresh_token',
          value: '',
          status: 'unknown'
        },
        {
          name: 'google_ads_client_id',
          value: '',
          status: 'unknown'
        },
        {
          name: 'google_ads_client_secret',
          value: '',
          status: 'unknown'
        },
        {
          name: 'google_ads_developer_token',
          value: '',
          status: 'unknown'
        },
        {
          name: 'google_ads_manager_id',
          value: '',
          status: 'unknown'
        }
      ];

      data?.forEach(token => {
        const tokenIndex = formattedTokens.findIndex(t => t.name === token.name);
        if (tokenIndex !== -1) {
          formattedTokens[tokenIndex].value = token.value || '';
          formattedTokens[tokenIndex].status = token.value ? 'valid' : 'invalid';
        }
      });

      setTokens(formattedTokens);
    } catch (error) {
      console.error('Erro ao buscar tokens:', error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar os tokens do Google Ads",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para testar os tokens
  const testGoogleAdsTokens = async () => {
    setIsRefreshing(true);
    setTestResult(null);
    setClients([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-token-check');
      
      if (error) {
        console.error('Erro ao testar tokens:', error);
        setTestResult({
          success: false,
          message: `Erro ao testar tokens: ${error.message || "Erro desconhecido"}`,
        });
        
        toast({
          title: "Erro",
          description: `Falha ao testar tokens: ${error.message || "Erro desconhecido"}`,
          variant: "destructive",
        });
      } else if (data.error) {
        console.error('Erro retornado pela função:', data.error);
        setTestResult({
          success: false,
          message: `Erro: ${data.error}`,
        });
        
        toast({
          title: "Erro",
          description: `Falha: ${data.error}`,
          variant: "destructive",
        });
      } else {
        console.log('Resposta da função:', data);
        
        await fetchTokens();
        
        setTestResult({
          success: true,
          message: data.message || "Tokens testados com sucesso",
          details: {
            apiAccess: data.apiAccess,
            tokenRefreshed: data.tokenRefreshed
          },
        });
        
        if (data.clients && Array.isArray(data.clients)) {
          setClients(data.clients);
        }
        
        toast({
          title: "Sucesso",
          description: data.message || "Tokens verificados com sucesso",
        });
      }
    } catch (error) {
      console.error('Erro ao invocar função:', error);
      setTestResult({
        success: false,
        message: `Erro no teste: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      });
      
      toast({
        title: "Erro",
        description: `Erro no teste: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtrar clientes com base no termo de pesquisa
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    client.id.includes(searchTerm)
  );

  // Renderizar nome do token de forma legível
  const getTokenDisplayName = (name: string) => {
    switch (name) {
      case 'google_ads_access_token':
        return 'Token de Acesso';
      case 'google_ads_refresh_token':
        return 'Refresh Token';
      case 'google_ads_client_id':
        return 'Client ID';
      case 'google_ads_client_secret':
        return 'Client Secret';
      case 'google_ads_developer_token':
        return 'Developer Token';
      case 'google_ads_manager_id':
        return 'ID da Conta Gerenciadora';
      default:
        return name;
    }
  };

  return (
    <Card className="space-y-4 p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Tokens do Google Ads</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Sistema automatizado ativo</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTokenValues(!showTokenValues)}
          >
            {showTokenValues ? (
              <><EyeOff className="h-4 w-4 mr-2" /> Ocultar valores</>
            ) : (
              <><Eye className="h-4 w-4 mr-2" /> Mostrar valores</>
            )}
          </Button>
          
          <Button
            onClick={testGoogleAdsTokens}
            disabled={isRefreshing}
            variant="default"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Testando...' : 'Testar tokens'}
          </Button>
        </div>
      </div>

      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"} className="mb-4">
          <AlertTitle className="flex items-center">
            {testResult.success ? (
              <><Check className="h-4 w-4 mr-2 text-green-500" /> Sucesso</>
            ) : (
              <><X className="h-4 w-4 mr-2" /> Erro</>
            )}
          </AlertTitle>
          <AlertDescription>
            <p>{testResult.message}</p>
            {testResult.success && testResult.details && (
              <div className="mt-2 text-sm">
                <p>
                  Token renovado: 
                  {testResult.details.tokenRefreshed ? 
                    <span className="text-green-500 font-medium ml-1">Sim</span> : 
                    <span className="text-red-500 font-medium ml-1">Não</span>}
                </p>
                <p>
                  API acessível: 
                  {testResult.details.apiAccess ? 
                    <span className="text-green-500 font-medium ml-1">Sim</span> : 
                    <span className="text-red-500 font-medium ml-1">Não</span>}
                </p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Exibir contas encontradas */}
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
              <div className="p-4">
                <Input
                  placeholder="Pesquisar por nome ou ID da conta"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-4"
                />
                
                <div className="max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/3">ID da Conta</TableHead>
                        <TableHead>Nome da Conta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.length > 0 ? (
                        filteredClients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-mono text-sm">{client.id}</TableCell>
                            <TableCell>{client.name || "Sem nome"}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                            Nenhuma conta encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Token</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              tokens.map((token) => (
                <TableRow key={token.name}>
                  <TableCell className="font-medium">
                    {getTokenDisplayName(token.name)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {showTokenValues ? 
                      token.value || <span className="text-gray-400">Não configurado</span> : 
                      token.value ? "••••••••••••••••" : <span className="text-gray-400">Não configurado</span>
                    }
                  </TableCell>
                  <TableCell className="text-center">
                    {token.status === "valid" ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : token.status === "invalid" ? (
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    ) : token.status === "loading" ? (
                      <RefreshCw className="h-5 w-5 animate-spin text-amber-500 mx-auto" />
                    ) : (
                      <span className="text-gray-400 text-sm">–</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-500 mt-2">
        <p>
          Sistema com renovação automática ativa. Use "Testar tokens" para verificar manualmente a conectividade.
        </p>
      </div>
    </Card>
  );
};
