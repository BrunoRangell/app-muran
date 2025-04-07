
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutoReviewTest } from "./AutoReviewTest";
import { DebugTools } from "./DebugTools";

export function AutoReviewSettings() {
  const [selectedTab, setSelectedTab] = useState("info");

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
          <TabsTrigger value="suporte">Suporte Técnico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Revisão Automática Meta Ads</CardTitle>
              <CardDescription>
                Informações sobre o funcionamento da revisão automática do Meta Ads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-2">Funcionamento</h3>
                  <p className="text-gray-700 mb-2">
                    A revisão automática do Meta Ads é um processo agendado que verifica regularmente os orçamentos de todas as contas ativas conectadas ao Meta Ads.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>Executa a cada 3 minutos automaticamente</li>
                    <li>Processa todas as contas de clientes ativos com Meta Ads configurado</li>
                    <li>Atualiza o dashboard com os valores mais recentes de gasto e orçamento</li>
                    <li>Mantém registros detalhados de todas as execuções</li>
                  </ul>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-2">Requisitos</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>Token do Meta Ads configurado e válido</li>
                    <li>Clientes com ID de conta Meta Ads configurado</li>
                    <li>Status do cliente definido como "ativo"</li>
                  </ul>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-2">Observações</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>O processamento pode levar de alguns segundos a alguns minutos, dependendo do número de clientes</li>
                    <li>Os resultados aparecem na tabela de execuções reais na aba de diagnóstico</li>
                    <li>Em caso de erros, verifique os logs detalhados para mais informações</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="diagnostico">
          <AutoReviewTest />
        </TabsContent>
        
        <TabsContent value="suporte">
          <DebugTools />
        </TabsContent>
      </Tabs>
    </div>
  );
}
