
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetaAdsTab } from '@/components/improved-reviews/tabs/MetaAdsTab';
import { GoogleAdsTab } from '@/components/improved-reviews/tabs/GoogleAdsTab';
import { CustomBudgetTab } from '@/components/improved-reviews/tabs/CustomBudgetTab';
import { SettingsTab } from '@/components/improved-reviews/tabs/SettingsTab';
import { BudgetManagerTab } from '@/components/improved-reviews/tabs/BudgetManagerTab';
import { useSearchParams } from 'react-router-dom';

export default function ImprovedDailyReviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [selectedTab, setSelectedTab] = useState<string>(tabParam || 'meta');
  const [lastReviewTime, setLastReviewTime] = useState<Date | undefined>(undefined);
  
  // Atualizar a URL quando a tab mudar
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setSearchParams({ tab: value });
  };
  
  // Função para registrar a hora da última atualização
  const handleRefreshCompleted = () => {
    const now = new Date();
    localStorage.setItem('improved_last_review_time', now.toISOString());
    setLastReviewTime(now);
  };
  
  return (
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
        <Tabs value={selectedTab} onValueChange={handleTabChange} defaultValue="meta">
          <TabsList className="mb-4">
            <TabsTrigger value="meta">Meta Ads</TabsTrigger>
            <TabsTrigger value="google">Google Ads</TabsTrigger>
            <TabsTrigger value="budgets">Orçamentos</TabsTrigger>
            <TabsTrigger value="custom-budgets">Orçamentos Personalizados</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="meta" className="space-y-6">
            <MetaAdsTab 
              onRefreshCompleted={handleRefreshCompleted}
              isActive={selectedTab === 'meta'}
            />
          </TabsContent>
          
          <TabsContent value="google" className="space-y-6">
            <GoogleAdsTab 
              onRefreshCompleted={handleRefreshCompleted}
              isActive={selectedTab === 'google'}
            />
          </TabsContent>
          
          <TabsContent value="budgets" className="space-y-6">
            <BudgetManagerTab />
          </TabsContent>
          
          <TabsContent value="custom-budgets" className="space-y-6">
            <CustomBudgetTab />
          </TabsContent>
          
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
