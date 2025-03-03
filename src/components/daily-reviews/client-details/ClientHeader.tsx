
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, RefreshCw } from "lucide-react";

interface ClientHeaderProps {
  client: any;
  onRefreshAnalysis: () => void;
  isRefreshing: boolean;
}

export const ClientHeader = ({ client, onRefreshAnalysis, isRefreshing }: ClientHeaderProps) => {
  return (
    <Card className="bg-white">
      <CardContent className="pt-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-muran-dark">
            {client.company_name}
          </h2>
          <p className="text-gray-500">ID da Conta Meta: {client.meta_account_id || "Não configurado"}</p>
        </div>
        
        <Button 
          className="mt-4 md:mt-0 bg-muran-primary hover:bg-muran-primary/90 text-white"
          onClick={onRefreshAnalysis}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <BarChart3 className="mr-2 h-4 w-4" />
              Atualizar Análise
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
