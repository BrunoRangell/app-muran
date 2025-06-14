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
  const [automatedSystemStatus, setAutomatedSystemStatus] = useState<any>(null);
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
    checkAutomatedSystemStatus();
    
    // Verificar status do sistema a cada 30 segundos
    const interval = setInterval(checkAutomatedSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Verificar status do sistema automatizado
  const checkAutomatedSystemStatus = async () => {
    try {
      const { data: systemLogs, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('event_type', 'token_renewal')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && systemLogs) {
        const latestLog = systemLogs[0];
        const now = new Date();
        const logTime = new Date(latestLog.created_at);
        const minutesSinceLastLog = Math.floor((now.getTime() - logTime.getTime()) / (1000 * 60));

        setAutomatedSystemStatus({
          isActive: true,
          lastActivity: latestLog.created_at,
          minutesSinceLastActivity: minutesSinceLastLog,
          lastMessage: latestLog.message,
          systemHealth: minutesSinceLastLog < 45 ? 'healthy' : minutesSinceLastLog < 60 ? 'warning' : 'critical'
        });
      }
    } catch (error) {
      console.error('Erro ao verificar status do sistema automatizado:', error);
    }
  };

  // Buscar tokens do banco de dados
  const fetchTokens = async () => {
    setIsLoading(true);
    
    try {
      // Buscar tokens do Google Ads
      const { data, error } = await supabase
        .from('api_tokens')
        .select('name, value')
        .or('name.eq.google_ads_access_token,name.eq.google_ads_refresh_token,name.eq.google_ads_client_id,name.eq.google_ads_client_secret,name.eq.google_ads_developer_token,name.eq.google_ads_manager_id');
      
      if (error) {
        throw error;
      }

      // Mapear para o formato de tokens
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

      // Preencher com os valores do banco de dados
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
        
        // Re-buscar os tokens para atualizar a lista
        await fetchTokens();
        await checkAutomatedSystemStatus();
        
        setTestResult({
          success: true,
          message: data.message || "Tokens testados com sucesso",
          details: {
            apiAccess: data.apiAccess,
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

  // Renderizar status do sistema automatizado
  const renderAutomatedSystemStatus = () => {
    if (!automatedSystemStatus) return null;

    const getStatusColor = (health: string) => {
      switch (health) {
        case 'healthy': return 'border-green-200 bg-green-50';
        case 'warning': return 'border-yellow-200 bg-yellow-50';
        case 'critical': return 'border-red-200 bg-red-50';
        default: return 'border-gray-200 bg-gray-50';
      }
    };

    const getStatusIcon = (health: string) => {
      switch (health) {
        case 'healthy': return '🟢';
        case 'warning': return '🟡';
        case 'critical': return '🔴';
        default: return '⚫';
      }
    };

    return (
      <Alert className={`mb-4 ${getStatusColor(automatedSystemStatus.systemHealth)}`}>
        <AlertTitle className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon(automatedSystemStatus.systemHealth)}</span>
          Sistema de Renovação Automática
          <Badge variant="outline" className="ml-2">
            {automatedSystemStatus.isActive ? 'ATIVO' : 'INATIVO'}
          </Badge>
        </AlertTitle>
        <AlertDescription>
          <div className="mt-2 space-y-1 text-sm">
            <p><strong>Status:</strong> {automatedSystemStatus.lastMessage}</p>
            <p><strong>Última atividade:</strong> {automatedSystemStatus.minutesSinceLastActivity} minutos atrás</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                Renovação automática: 30min
              </Badge>
              <Badge variant="outline" className="text-xs">
                Verificação de saúde: 15min
              </Badge>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card className="space-y-4 p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Tokens do Google Ads</h3>
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

      {/* Status do Sistema Automatizado */}
      {renderAutomatedSystemStatus()}

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
                            Nenhuma conta encontrada com esse termo de pesquisa
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {clients.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {filteredClients.length} de {clients.length} contas exibidas
                  </p>
                )}
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
              // Estado de carregamento
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
              // Dados dos tokens
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
          O sistema automático renova os tokens a cada 30 minutos e verifica a saúde a cada 15 minutos.
          Clique em "Testar tokens" para verificar manualmente a conectividade com a API do Google Ads.
        </p>
      </div>
    </Card>
  );
};
