import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { type ClientBudget } from "../hooks/useBudgetSetup";

type SecondaryAccount = {
  id?: string;
  account_id: string;
  account_name: string;
  budget_amount: string;
  platform: 'meta' | 'google';
};

type SecondaryAccountsTableProps = {
  filteredClients: ClientBudget[] | undefined;
  onSaveSecondaryAccount: (clientId: string, account: SecondaryAccount) => Promise<void>;
  onDeleteSecondaryAccount: (accountId: string) => Promise<void>;
};

export const SecondaryAccountsTable = ({
  filteredClients,
  onSaveSecondaryAccount,
  onDeleteSecondaryAccount,
}: SecondaryAccountsTableProps) => {
  const [newAccounts, setNewAccounts] = useState<Record<string, SecondaryAccount>>({});

  const handleAddNewAccount = (clientId: string, platform: 'meta' | 'google') => {
    const key = `${clientId}-${platform}`;
    setNewAccounts(prev => ({
      ...prev,
      [key]: {
        account_id: "",
        account_name: "",
        budget_amount: "",
        platform
      }
    }));
  };

  const handleUpdateNewAccount = (clientId: string, platform: 'meta' | 'google', field: keyof SecondaryAccount, value: string) => {
    const key = `${clientId}-${platform}`;
    setNewAccounts(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === 'budget_amount' && value ? 
          parseFloat(value.replace(/\./g, '').replace(',', '.')).toLocaleString('pt-BR') : 
          value
      }
    }));
  };

  const handleSaveNewAccount = async (clientId: string, platform: 'meta' | 'google') => {
    const key = `${clientId}-${platform}`;
    const account = newAccounts[key];
    
    if (account && account.account_id && account.account_name) {
      await onSaveSecondaryAccount(clientId, account);
      setNewAccounts(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };

  const handleCancelNewAccount = (clientId: string, platform: 'meta' | 'google') => {
    const key = `${clientId}-${platform}`;
    setNewAccounts(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const formatBudgetValue = (value: string) => {
    if (!value) return "";
    // Permitir apenas números, vírgulas e pontos
    let sanitizedValue = value.replace(/[^0-9,.]/g, "");
    
    // Aplicar formatação com separador de milhares
    if (sanitizedValue) {
      // Remover pontos existentes (separadores de milhares)
      const numberValue = sanitizedValue.replace(/\./g, '').replace(',', '.');
      const parsedValue = parseFloat(numberValue);
      
      if (!isNaN(parsedValue)) {
        // Formatar com separador de milhares (ponto) e vírgula para decimais
        return parsedValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });
      }
    }
    
    return sanitizedValue;
  };

  if (!filteredClients || filteredClients.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Contas Secundárias</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {filteredClients.map((client) => {
            const secondaryMetaAccounts = client.client_accounts.filter(
              acc => acc.platform === 'meta' && !acc.is_primary
            );
            const secondaryGoogleAccounts = client.client_accounts.filter(
              acc => acc.platform === 'google' && !acc.is_primary
            );
            
            const hasSecondaryAccounts = secondaryMetaAccounts.length > 0 || secondaryGoogleAccounts.length > 0;
            const hasNewAccounts = newAccounts[`${client.id}-meta`] || newAccounts[`${client.id}-google`];
            
            if (!hasSecondaryAccounts && !hasNewAccounts) {
              return (
                <div key={client.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">{client.company_name}</h3>
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddNewAccount(client.id, 'meta')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Conta Meta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddNewAccount(client.id, 'google')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Conta Google
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Nenhuma conta secundária configurada</p>
                </div>
              );
            }

            return (
              <div key={client.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">{client.company_name}</h3>
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddNewAccount(client.id, 'meta')}
                      disabled={!!newAccounts[`${client.id}-meta`]}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Conta Meta
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddNewAccount(client.id, 'google')}
                      disabled={!!newAccounts[`${client.id}-google`]}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Conta Google
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Plataforma</TableHead>
                      <TableHead className="w-[200px]">ID da Conta</TableHead>
                      <TableHead className="w-[200px]">Nome da Conta</TableHead>
                      <TableHead className="w-[150px]">Orçamento</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Contas secundárias existentes */}
                    {[...secondaryMetaAccounts, ...secondaryGoogleAccounts].map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">
                          {account.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
                        </TableCell>
                        <TableCell>{account.account_id}</TableCell>
                        <TableCell>{account.account_name}</TableCell>
                        <TableCell>R$ {account.budget_amount.toLocaleString('pt-BR')}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDeleteSecondaryAccount(account.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Formulários para novas contas */}
                    {['meta', 'google'].map((platform) => {
                      const key = `${client.id}-${platform}`;
                      const newAccount = newAccounts[key];
                      
                      if (!newAccount) return null;

                      return (
                        <TableRow key={key}>
                          <TableCell className="font-medium">
                            {platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="ID da conta"
                              value={newAccount.account_id}
                              onChange={(e) => handleUpdateNewAccount(client.id, platform as 'meta' | 'google', 'account_id', e.target.value)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Nome da conta"
                              value={newAccount.account_name}
                              onChange={(e) => handleUpdateNewAccount(client.id, platform as 'meta' | 'google', 'account_name', e.target.value)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">R$</span>
                              <Input
                                placeholder="0,00"
                                value={newAccount.budget_amount}
                                onChange={(e) => handleUpdateNewAccount(client.id, platform as 'meta' | 'google', 'budget_amount', formatBudgetValue(e.target.value))}
                                className="w-full"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                onClick={() => handleSaveNewAccount(client.id, platform as 'meta' | 'google')}
                                disabled={!newAccount.account_id || !newAccount.account_name}
                              >
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelNewAccount(client.id, platform as 'meta' | 'google')}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};