
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, CheckCircle, Clock, Filter, Trash } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const GoogleAdsTokenLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);

  const fetchLogs = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("google_ads_token_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
        
      if (error) {
        throw error;
      }
      
      setLogs(data || []);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar logs quando os filtros ou os dados mudarem
  useEffect(() => {
    let filtered = [...logs];
    
    if (eventFilter !== "all") {
      filtered = filtered.filter(log => log.event_type === eventFilter);
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(log => log.token_status === statusFilter);
    }
    
    setFilteredLogs(filtered);
  }, [logs, eventFilter, statusFilter]);

  // Carregar logs iniciais
  useEffect(() => {
    fetchLogs();
  }, []);

  const clearLogs = async () => {
    try {
      setIsLoading(true);
      
      // Remover todos os logs mais antigos que 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { error } = await supabase
        .from("google_ads_token_logs")
        .delete()
        .lt("created_at", sevenDaysAgo.toISOString());
        
      if (error) {
        throw error;
      }
      
      // Atualizar a lista de logs
      fetchLogs();
    } catch (error) {
      console.error("Erro ao limpar logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (event: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'check': <CheckCircle className="h-4 w-4 text-blue-500" />,
      'refresh': <RefreshCw className="h-4 w-4 text-green-500" />,
      'error': <AlertCircle className="h-4 w-4 text-red-500" />,
      'use': <Clock className="h-4 w-4 text-purple-500" />
    };
    
    return iconMap[event] || <CheckCircle className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, label: string }> = {
      'valid': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Válido' },
      'expired': { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Expirado' },
      'unknown': { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Desconhecido' },
      'refreshing': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Renovando' },
      'error': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Erro' },
    };
    
    const styles = statusMap[status] || statusMap.unknown;
    
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles.color}`}>
      {styles.label}
    </span>;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
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

  const renderSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="border border-gray-200 rounded p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-3/4 mt-2" />
        </div>
      ))}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">Histórico de Operações</CardTitle>
            <CardDescription>
              Monitoramento de eventos e operações dos tokens Google Ads
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchLogs}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200"
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar registros antigos?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação removerá todos os registros com mais de 7 dias. Este processo não pode ser desfeito.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={clearLogs}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="visual">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="visual" className="flex-1">Visual</TabsTrigger>
            <TabsTrigger value="table" className="flex-1">Tabela</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Filtros:</span>
            </div>
            
            <div className="flex gap-2">
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Tipo de Evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os eventos</SelectItem>
                  <SelectItem value="check">Verificação</SelectItem>
                  <SelectItem value="refresh">Renovação</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="use">Uso</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Status do Token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="valid">Válido</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                  <SelectItem value="refreshing">Renovando</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="unknown">Desconhecido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Badge variant="outline" className="ml-auto text-xs">
              {filteredLogs.length} eventos
            </Badge>
          </div>
          
          <TabsContent value="visual">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                renderSkeleton()
              ) : filteredLogs.length === 0 ? (
                <div className="text-center p-4 text-gray-500">
                  Nenhum registro encontrado
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="border border-gray-200 rounded p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getEventIcon(log.event_type)}
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {log.event_type.toUpperCase()}
                          </Badge>
                          {getStatusBadge(log.token_status)}
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                      </div>
                      <p className="text-sm mt-1">{log.message}</p>
                      {log.details && (
                        <details className="mt-1">
                          <summary className="text-xs text-blue-500 cursor-pointer">Detalhes</summary>
                          <pre className="text-xs mt-1 bg-gray-50 p-1 rounded overflow-x-auto">
                            {log.details}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="table">
            <ScrollArea className="h-[400px]">
              <div className="w-full overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Data/Hora</th>
                      <th className="px-4 py-2 text-left">Evento</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Mensagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-4 py-2"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-4 py-2"><Skeleton className="h-4 w-16" /></td>
                          <td className="px-4 py-2"><Skeleton className="h-4 w-40" /></td>
                        </tr>
                      ))
                    ) : filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          Nenhum registro encontrado
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b">
                          <td className="px-4 py-2 text-xs text-gray-600">{formatDate(log.created_at)}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1">
                              {getEventIcon(log.event_type)}
                              {log.event_type.toUpperCase()}
                            </div>
                          </td>
                          <td className="px-4 py-2">{getStatusBadge(log.token_status)}</td>
                          <td className="px-4 py-2">
                            <div>
                              {log.message}
                              {log.details && (
                                <details className="mt-1">
                                  <summary className="text-xs text-blue-500 cursor-pointer">Detalhes</summary>
                                  <pre className="text-xs mt-1 bg-gray-50 p-1 rounded overflow-x-auto">
                                    {log.details}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
