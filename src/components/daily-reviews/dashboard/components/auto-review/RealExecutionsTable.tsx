
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "../utils/dateFormatUtils";
import { CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react";

interface LogEntry {
  id: string;
  job_name: string;
  status: string;
  execution_time: string;
  details?: any;
}

interface RealExecutionsTableProps {
  logs: LogEntry[];
}

export const RealExecutionsTable = ({ logs }: RealExecutionsTableProps) => {
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
      case 'test_success':
      case 'active':
        return <Badge className="bg-green-500">Sucesso</Badge>;
      case 'in_progress':
      case 'started':
        return <Badge className="bg-blue-500">Em Andamento</Badge>;
      case 'error':
        return <Badge className="bg-red-500">Erro</Badge>;
      case 'partial_success':
        return <Badge className="bg-amber-500">Sucesso Parcial</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhuma execução real encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {logs.map((log) => (
        <div key={log.id} className="border rounded-md p-3 text-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium mb-1 flex items-center">
                Execução Real
                <span className="mx-2">•</span>
                {renderStatusBadge(log.status)}
              </div>
              <div className="text-xs text-gray-500">
                {formatDateTime(log.execution_time)}
              </div>
            </div>
          </div>
          
          {log.details && (
            <div className="mt-2 pt-2 border-t text-xs">
              <div className="grid grid-cols-2 gap-2">
                {log.details.source && (
                  <div>
                    <span className="font-medium">Fonte: </span>
                    {log.details.source}
                  </div>
                )}
                
                {log.details.totalClients !== undefined && (
                  <div>
                    <span className="font-medium">Total Clientes: </span>
                    {log.details.totalClients}
                  </div>
                )}
                
                {log.details.processedClients !== undefined && (
                  <div>
                    <span className="font-medium">Processados: </span>
                    {log.details.processedClients} 
                    {log.details.totalClients && ` de ${log.details.totalClients}`}
                    {log.details.percentComplete !== undefined && ` (${log.details.percentComplete}%)`}
                  </div>
                )}
                
                <div className="col-span-2 grid grid-cols-3 gap-1 mt-1">
                  {log.details.successCount !== undefined && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span>Sucessos: {log.details.successCount}</span>
                    </div>
                  )}
                  
                  {log.details.errorCount !== undefined && (
                    <div className="flex items-center text-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      <span>Erros: {log.details.errorCount}</span>
                    </div>
                  )}
                  
                  {log.details.skippedCount !== undefined && (
                    <div className="flex items-center text-amber-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      <span>Pulados: {log.details.skippedCount}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {log.status === 'error' && log.details.error && (
                <div className="mt-1 text-red-500">
                  <span className="font-medium">Erro: </span>
                  {log.details.error}
                </div>
              )}
              
              {log.details.completedAt && (
                <div className="mt-1 text-gray-500 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span className="font-medium">Concluído em: </span>
                  {formatDateTime(log.details.completedAt)}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
