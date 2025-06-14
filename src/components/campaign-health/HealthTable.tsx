
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Eye, Play, Loader } from "lucide-react";
import { StatusIndicator } from "./StatusIndicator";
import { formatCurrency } from "@/utils/formatters";
import { useBatchOperations } from "../improved-reviews/hooks/useBatchOperations";
import { useToast } from "@/hooks/use-toast";
import { UnifiedLoadingState } from "@/components/common/UnifiedLoadingState";

interface HealthTableProps {
  data: any[];
  isLoading: boolean;
  error: any;
  searchQuery: string;
  platformFilter: "all" | "meta" | "google";
  statusFilter: "all" | "problems" | "normal";
}

export function HealthTable({ 
  data, 
  isLoading, 
  error, 
  searchQuery, 
  platformFilter, 
  statusFilter 
}: HealthTableProps) {
  const { toast } = useToast();
  const [processingClient, setProcessingClient] = useState<string | null>(null);

  // Filter data based on search and filters
  const filteredData = data?.filter(client => {
    const matchesSearch = client.company_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const matchesPlatform = platformFilter === "all" || 
      (platformFilter === "meta" && client.meta_account_id) ||
      (platformFilter === "google" && client.google_account_id);
    
    const hasProblems = client.health_status === "error" || 
      client.health_status === "warning";
    
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "problems" && hasProblems) ||
      (statusFilter === "normal" && !hasProblems);
    
    return matchesSearch && matchesPlatform && matchesStatus;
  }) || [];

  const handleReviewClient = async (client: any) => {
    setProcessingClient(client.id);
    
    try {
      // Simular revisão do cliente
      console.log(`🔍 Iniciando revisão do cliente ${client.company_name}`);
      
      // Aqui você integraria com o sistema de revisões existente
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Revisão concluída",
        description: `Cliente ${client.company_name} analisado com sucesso`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na revisão",
        description: error.message || "Ocorreu um erro na revisão",
        variant: "destructive",
      });
    } finally {
      setProcessingClient(null);
    }
  };

  const handleViewDetails = (client: any) => {
    // Redirecionar para a página de revisão específica
    window.location.href = `/revisao-diaria-avancada#${client.meta_account_id ? 'meta-ads' : 'google-ads'}`;
  };

  if (isLoading) {
    return <UnifiedLoadingState message="Carregando dados de saúde das campanhas..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erro ao carregar dados
          </h3>
          <p className="text-gray-600">
            {error.message || "Ocorreu um erro ao carregar os dados de saúde das campanhas"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead className="text-right">Custo Hoje</TableHead>
                <TableHead className="text-right">Impressões Hoje</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Campanhas com Erro</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhum cliente encontrado com os filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((client) => (
                  <TableRow key={client.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {client.company_name}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-1">
                        {client.meta_account_id && (
                          <Badge variant="outline" className="text-xs">Meta</Badge>
                        )}
                        {client.google_account_id && (
                          <Badge variant="outline" className="text-xs">Google</Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      {formatCurrency(client.today_spend || 0)}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      {(client.today_impressions || 0).toLocaleString('pt-BR')}
                    </TableCell>
                    
                    <TableCell>
                      <StatusIndicator status={client.health_status} />
                    </TableCell>
                    
                    <TableCell>
                      {client.error_campaigns_count > 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          {client.error_campaigns_count} erro(s)
                        </Badge>
                      ) : (
                        <span className="text-gray-500 text-sm">Nenhum erro</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(client)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReviewClient(client)}
                          disabled={processingClient === client.id}
                          className="h-8 w-8 p-0"
                        >
                          {processingClient === client.id ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
