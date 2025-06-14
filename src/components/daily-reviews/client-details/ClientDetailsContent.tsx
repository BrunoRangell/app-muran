
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { MetaAccount } from "../hooks/types/accountTypes";
import { LatestReviewTab } from "./tabs/LatestReviewTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { MetaAccountTab } from "./tabs/MetaAccountTab";

interface ClientDetailsContentProps {
  clientId: string;
  client: ClientWithReview;
  metaAccount: MetaAccount | null;
  isPrimaryAccount: boolean;
  customBudget: any | null;
  isUsingCustomBudgetInReview: boolean;
  onBack: () => void;
}

export const ClientDetailsContent = ({
  clientId,
  client,
  metaAccount,
  isPrimaryAccount,
  customBudget,
  isUsingCustomBudgetInReview,
  onBack
}: ClientDetailsContentProps) => {
  const [activeTab, setActiveTab] = useState("latest");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              <ArrowRight className="h-4 w-4 rotate-180" />
              <span className="ml-1">Voltar</span>
            </Button>
            <CardTitle className="text-xl font-bold text-[#321e32]">
              {client.company_name}
            </CardTitle>
            {metaAccount?.account_name && (
              <Badge variant="secondary" className="ml-2">
                {metaAccount.account_name}
                {isPrimaryAccount && (
                  <span className="text-xs text-[#ff6e00] ml-1">(Principal)</span>
                )}
              </Badge>
            )}
            {customBudget && isUsingCustomBudgetInReview && (
              <Badge className="bg-[#ff6e00]/10 text-[#ff6e00] hover:bg-[#ff6e00]/20 border-none ml-2">
                Orçamento personalizado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="latest">Última Revisão</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
              <TabsTrigger value="meta-account">Conta Meta</TabsTrigger>
            </TabsList>

            <TabsContent value="latest">
              <LatestReviewTab clientId={clientId} />
            </TabsContent>

            <TabsContent value="history">
              <HistoryTab clientId={clientId} />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsTab
                clientId={clientId}
                clientName={client.company_name}
                currentBudget={client.meta_ads_budget}
              />
            </TabsContent>

            <TabsContent value="meta-account">
              <MetaAccountTab
                clientId={clientId}
                clientName={client.company_name}
                metaAccountId={client.meta_account_id}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
