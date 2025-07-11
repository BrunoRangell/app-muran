
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader, Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ClientBudget, type BudgetValues } from "../hooks/useBudgetSetup";
import { formatCurrencyInput } from "@/utils/currencyUtils";

type BudgetTableProps = {
  filteredClients: ClientBudget[] | undefined;
  isLoading: boolean;
  budgets: Record<string, BudgetValues>;
  searchTerm: string;
  onBudgetChange: (clientId: string, value: string) => void;
  onAccountIdChange: (clientId: string, value: string) => void;
  onGoogleBudgetChange?: (clientId: string, value: string) => void;
  onGoogleAccountIdChange?: (clientId: string, value: string) => void;
  onAddSecondaryAccount?: (clientId: string, clientName: string) => void;
  onDeleteSecondaryAccount?: (accountId: string) => void;
  temporaryAccounts?: Record<string, Array<{id: string, platform: 'meta' | 'google', name: string}>>;
};

export const BudgetTable = ({
  filteredClients,
  isLoading,
  budgets,
  searchTerm,
  onBudgetChange,
  onAccountIdChange,
  onGoogleBudgetChange,
  onGoogleAccountIdChange,
  onAddSecondaryAccount,
  onDeleteSecondaryAccount,
  temporaryAccounts = {},
}: BudgetTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="animate-spin mr-2" />
        <span>Carregando clientes...</span>
      </div>
    );
  }

  if (!filteredClients || filteredClients.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        {searchTerm ? 
          `Nenhum cliente encontrado com o termo "${searchTerm}"` :
          "Nenhum cliente encontrado"
        }
      </div>
    );
  }

  // Verificar se os manipuladores de Google Ads estão disponíveis
  const showGoogleFields = !!onGoogleBudgetChange && !!onGoogleAccountIdChange;

  const handleBudgetInputChange = (accountId: string, value: string, handler: (id: string, val: string) => void) => {
    const formatted = formatCurrencyInput(value);
    handler(accountId, formatted);
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Cliente</TableHead>
            <TableHead className={showGoogleFields ? "w-[150px]" : "w-[200px]"}>ID da Conta Meta</TableHead>
            <TableHead className={showGoogleFields ? "w-[150px]" : "w-[200px]"}>Orçamento Meta Ads</TableHead>
            {showGoogleFields && (
              <>
                <TableHead className="w-[150px]">ID da Conta Google</TableHead>
                <TableHead className="w-[150px]">Orçamento Google Ads</TableHead>
              </>
            )}
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredClients.map((client) => {
            // Organizar contas por plataforma com primárias primeiro
            const metaAccounts = (client.client_accounts || [])
              .filter(acc => acc.platform === 'meta')
              .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
            
            const googleAccounts = (client.client_accounts || [])
              .filter(acc => acc.platform === 'google')
              .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

            // Adicionar contas temporárias do cliente
            const clientTempAccounts = temporaryAccounts[client.id] || [];
            const tempMetaAccounts = clientTempAccounts.filter(temp => temp.platform === 'meta').map(temp => ({
              id: temp.id,
              platform: 'meta' as const,
              account_id: '',
              account_name: temp.name,
              budget_amount: 0,
              is_primary: false,
              isTemporary: true
            }));
            const allMetaAccounts = [...metaAccounts, ...tempMetaAccounts];

            // Garantir que sempre haja pelo menos uma linha por cliente
            const maxAccounts = Math.max(allMetaAccounts.length, showGoogleFields ? googleAccounts.length : 0, 1);
            
            return Array.from({ length: maxAccounts }, (_, index) => {
              const metaAccount = allMetaAccounts[index];
              const googleAccount = showGoogleFields ? googleAccounts[index] : undefined;
              const isFirstRow = index === 0;
              const tempAccountKey = !metaAccount ? `${client.id}-meta-temp` : null;
              const isTemporaryAccount = metaAccount && 'isTemporary' in metaAccount && metaAccount.isTemporary;
              
              return (
                <TableRow key={`${client.id}-${index}`} className={!isFirstRow ? "border-t-0" : ""}>
                  <TableCell className={`font-medium ${!isFirstRow ? "text-transparent border-l-2 border-gray-200 pl-4" : ""}`}>
                    <div className="flex items-center gap-2">
                      {isFirstRow ? client.company_name : ""}
                      {isTemporaryAccount ? `${client.company_name} - secundária` : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`account-${metaAccount?.id || tempAccountKey || `${client.id}-meta-${index}`}`} className="sr-only">
                        ID da Conta Meta
                      </Label>
                      <Input
                        id={`account-${metaAccount?.id || tempAccountKey || `${client.id}-meta-${index}`}`}
                        placeholder="ID da conta"
                        value={metaAccount ? (budgets[metaAccount.id]?.account_id || "") : (tempAccountKey ? (budgets[tempAccountKey]?.account_id || "") : "")}
                        onChange={(e) => {
                          const accountKey = metaAccount?.id || tempAccountKey;
                          if (accountKey) {
                            onAccountIdChange(accountKey, e.target.value);
                          }
                        }}
                        className="max-w-[150px]"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`meta-${metaAccount?.id || tempAccountKey || `${client.id}-meta-budget-${index}`}`} className="sr-only">
                        Orçamento Meta Ads
                      </Label>
                      <span className="text-gray-500">R$</span>
                      <Input
                        id={`meta-${metaAccount?.id || tempAccountKey || `${client.id}-meta-budget-${index}`}`}
                        placeholder="0,00"
                        value={metaAccount ? (budgets[metaAccount.id]?.budget_amount || "") : (tempAccountKey ? (budgets[tempAccountKey]?.budget_amount || "") : "")}
                        onChange={(e) => {
                          const accountKey = metaAccount?.id || tempAccountKey;
                          if (accountKey) {
                            handleBudgetInputChange(accountKey, e.target.value, onBudgetChange);
                          }
                        }}
                        className="max-w-[150px]"
                        type="text"
                      />
                    </div>
                  </TableCell>
                  {showGoogleFields && (
                    <>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`google-account-${googleAccount?.id || `${client.id}-google-${index}`}`} className="sr-only">
                            ID da Conta Google
                          </Label>
                          <Input
                            id={`google-account-${googleAccount?.id || `${client.id}-google-${index}`}`}
                            placeholder="ID da conta Google"
                            value={googleAccount ? (budgets[googleAccount.id]?.account_id || "") : ""}
                            onChange={(e) => {
                              if (googleAccount) {
                                onGoogleAccountIdChange!(googleAccount.id, e.target.value);
                              }
                            }}
                            className="max-w-[150px]"
                            disabled={!googleAccount}
                          />
                          {googleAccount && (
                            googleAccount.is_primary ? (
                              <span className="text-xs text-green-600 font-medium">Principal</span>
                            ) : (
                              <span className="text-xs text-blue-600 font-medium">Secundária</span>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`google-${googleAccount?.id || `${client.id}-google-budget-${index}`}`} className="sr-only">
                            Orçamento Google Ads
                          </Label>
                          <span className="text-gray-500">R$</span>
                          <Input
                            id={`google-${googleAccount?.id || `${client.id}-google-budget-${index}`}`}
                            placeholder="0,00"
                            value={googleAccount ? (budgets[googleAccount.id]?.budget_amount || "") : ""}
                            onChange={(e) => {
                              if (googleAccount) {
                                handleBudgetInputChange(googleAccount.id, e.target.value, onGoogleBudgetChange!);
                              }
                            }}
                            className="max-w-[150px]"
                            type="text"
                            disabled={!googleAccount}
                          />
                        </div>
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {/* Botão + apenas na primeira linha */}
                      {isFirstRow && onAddSecondaryAccount && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAddSecondaryAccount(client.id, client.company_name)}
                          className="h-6 w-6 p-0 text-[#ff6e00] hover:text-[#ff6e00]/80 hover:bg-[#ff6e00]/10"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Botão de lixeira apenas para contas secundárias */}
                      {metaAccount && !metaAccount.is_primary && onDeleteSecondaryAccount && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteSecondaryAccount(metaAccount.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      {googleAccount && !googleAccount.is_primary && onDeleteSecondaryAccount && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteSecondaryAccount(googleAccount.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            });
          })}
        </TableBody>
      </Table>
    </div>
  );
};
