
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";

interface TokenLog {
  id: string;
  event_type: string;
  token_status: string;
  message: string;
  details?: string;
  created_at: string;
}

export const GoogleAdsTokenLogs = () => {
  const [logs, setLogs] = useState<TokenLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("google_ads_token_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);
        
        if (error) {
          console.error("Erro ao buscar logs:", error);
          throw error;
        }
        
        setLogs(data || []);
      } catch (error) {
        console.error("Erro ao carregar logs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
    
    // Setup subscription for real-time updates
    const subscription = supabase
      .channel('google_ads_token_logs_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'google_ads_token_logs' 
      }, payload => {
        // Atualizar os logs quando houver mudanças
        fetchLogs();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Formatar data no formato brasileiro
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Determinar classe de cor baseada no status
  const getStatusClass = (status?: string) => {
    if (!status) return "text-gray-500";
    
    switch (status.toLowerCase()) {
      case 'valid':
        return "text-green-600";
      case 'expired':
        return "text-orange-500";
      case 'error':
        return "text-red-600";
      case 'refreshing':
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Logs de Token Google Ads</CardTitle>
        <CardDescription>Histórico de atividades e verificações de token</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          {logs.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              {isLoading ? "Carregando logs..." : "Nenhum log encontrado"}
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="border rounded-md p-3 text-sm"
                >
                  <div className="flex justify-between items-start">
                    <span className={`font-medium ${getStatusClass(log.token_status)}`}>
                      {log.event_type === 'refresh' ? '🔄 Renovação' : 
                       log.event_type === 'check' ? '🔍 Verificação' : 
                       log.event_type === 'error' ? '❌ Erro' :
                       log.event_type === 'use' ? '🔑 Uso' : 'Evento'}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                  </div>
                  <p className="mt-1">{log.message}</p>
                  {log.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">Detalhes técnicos</summary>
                      <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(JSON.parse(log.details), null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
