
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReviewsProvider } from '@/contexts/ReviewsContext';
import { MetaReviewsTab } from '@/components/reviews/meta/MetaReviewsTab';
import { GoogleReviewsTab } from '@/components/reviews/google/GoogleReviewsTab';
import { useSearchParams } from 'react-router-dom';

export default function RevisaoDiaria() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [selectedTab, setSelectedTab] = useState<string>(tabParam || 'meta');
  const [lastReviewTime, setLastReviewTime] = useState<Date | undefined>(undefined);
  
  // Atualizar a URL quando a tab mudar
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setSearchParams({ tab: value });
  };

  // Ao inicializar o componente, verificar se há uma última revisão salva
  useEffect(() => {
    const lastReviewTimeStr = localStorage.getItem('last_review_time');
    if (lastReviewTimeStr) {
      setLastReviewTime(new Date(lastReviewTimeStr));
    }
  }, []);

  // Função para registrar a hora da última atualização
  const handleRefreshCompleted = () => {
    const now = new Date();
    localStorage.setItem('last_review_time', now.toISOString());
    setLastReviewTime(now);
  };
  
  return (
    <ReviewsProvider>
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
            Revisão Diária de Orçamentos
          </h1>
          
          {lastReviewTime && (
            <div className="text-sm text-gray-500">
              Última atualização: {lastReviewTime.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Tabs value={selectedTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="meta">Meta Ads</TabsTrigger>
              <TabsTrigger value="google">Google Ads</TabsTrigger>
              <TabsTrigger value="budgets">Orçamentos</TabsTrigger>
              <TabsTrigger value="custom-budgets">Orçamentos Personalizados</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="meta" className="space-y-6">
              <MetaReviewsTab onRefreshCompleted={handleRefreshCompleted} />
            </TabsContent>
            
            <TabsContent value="google" className="space-y-6">
              <GoogleReviewsTab onRefreshCompleted={handleRefreshCompleted} />
            </TabsContent>
            
            <TabsContent value="budgets" className="space-y-6">
              <div className="p-10 text-center">
                <h3 className="text-xl font-medium">Gerenciamento de Orçamentos</h3>
                <p className="text-gray-500 mt-2">
                  Funcionalidade em desenvolvimento. Estará disponível em breve.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="custom-budgets" className="space-y-6">
              <div className="p-10 text-center">
                <h3 className="text-xl font-medium">Orçamentos Personalizados</h3>
                <p className="text-gray-500 mt-2">
                  Funcionalidade em desenvolvimento. Estará disponível em breve.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="settings">
              <div className="p-10 text-center">
                <h3 className="text-xl font-medium">Configurações</h3>
                <p className="text-gray-500 mt-2">
                  Funcionalidade em desenvolvimento. Estará disponível em breve.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ReviewsProvider>
  );
}
