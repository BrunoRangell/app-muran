
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGoogleAdsService } from "./hooks/useGoogleAdsService";
import { Button } from "@/components/ui/button";
import { ClientSelector } from "./ClientSelector";
import { Loader, Search, RefreshCcw } from "lucide-react";

export function GoogleAdsDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    isLoading,
    accounts,
    selectedAccount,
    selectAccount,
    fetchAccountData
  } = useGoogleAdsService();

  const filteredAccounts = accounts.filter(account => 
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFetchAccount = (accountId: string) => {
    if (accountId) {
      selectAccount(accountId);
      fetchAccountData(accountId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <div className="flex-grow md:max-w-md">
          <ClientSelector
            onClientSelected={handleFetchAccount}
            showSearch={true}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            icon={<Search className="h-4 w-4 text-gray-400" />}
            customOptions={accounts.map(account => ({
              id: account.id,
              name: `${account.name} (${account.id})`,
              metadata: { accountId: account.id }
            }))}
            buttonText="Analisar"
            buttonIcon={<RefreshCcw className="h-4 w-4 mr-2" />}
            placeholder="Pesquisar conta do Google Ads..."
          />
        </div>
        
        <div className="md:ml-auto flex items-center">
          <div className="text-sm text-gray-500">
            {filteredAccounts.length} contas encontradas
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader className="h-8 w-8 animate-spin text-[#ff6e00]" />
        </div>
      )}

      {!isLoading && !selectedAccount && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Google Ads Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              Selecione uma conta do Google Ads acima para visualizar seus dados
            </p>
          </CardContent>
        </Card>
      )}

      {selectedAccount && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Detalhes da Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Nome da Conta</div>
                  <div className="font-medium">{selectedAccount.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">ID da Conta</div>
                  <div className="font-medium">{selectedAccount.id}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
