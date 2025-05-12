
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientDetails } from "@/components/new-reviews/hooks/useClientDetails";

export default function ClientDetails() {
  const { clientId } = useParams<{ clientId: string }>();
  const { client, isLoading, error } = useClientDetails(clientId);
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error || !client) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Erro ao carregar dados</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error ? (typeof error === 'string' ? error : error.message) : "Cliente não encontrado"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">{client.company_name}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Orçamento Meta Ads</h3>
              <p>{client.meta_ads_budget ? `R$ ${client.meta_ads_budget.toFixed(2)}` : 'Não definido'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Status</h3>
              <p>{client.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Em desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Esta página de detalhes do cliente está em desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
