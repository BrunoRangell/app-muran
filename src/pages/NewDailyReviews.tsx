
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetaAdsTab } from '@/components/new-reviews/tabs/MetaAdsTab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewDailyReviews() {
  const [activeTab, setActiveTab] = useState('meta-ads');
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
        Revisão Diária (Nova Interface)
      </h1>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Painel de Revisão</CardTitle>
          <CardDescription>
            Gerencie as revisões diárias de orçamento das suas campanhas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="meta-ads">Meta Ads</TabsTrigger>
              <TabsTrigger value="google-ads">Google Ads</TabsTrigger>
            </TabsList>
            
            <TabsContent value="meta-ads" className="space-y-4">
              <MetaAdsTab />
            </TabsContent>
            
            <TabsContent value="google-ads" className="space-y-4">
              <div className="p-6 text-center">
                <p className="text-gray-500">
                  Funcionalidade Google Ads em desenvolvimento.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
