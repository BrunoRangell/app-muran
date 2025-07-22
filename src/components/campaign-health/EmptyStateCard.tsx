
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, Plus } from "lucide-react";

interface EmptyStateCardProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  hasFilters: boolean;
}

export function EmptyStateCard({ onRefresh, isRefreshing, hasFilters }: EmptyStateCardProps) {
  if (hasFilters) {
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum resultado encontrado
          </h3>
          <p className="text-gray-500 text-center mb-4 max-w-md">
            Nenhum cliente foi encontrado com os filtros aplicados. 
            Tente ajustar os filtros ou limpar a busca.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Plus className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhuma revisão disponível para hoje
        </h3>
        <p className="text-gray-500 text-center mb-6 max-w-md">
          Os dados de hoje ainda não foram processados. 
          Clique em atualizar para buscar os dados mais recentes.
        </p>
        <Button 
          variant="outline" 
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          {isRefreshing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isRefreshing ? "Atualizando..." : "Atualizar dados"}
        </Button>
      </CardContent>
    </Card>
  );
}
