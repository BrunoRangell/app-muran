
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ClientBudget, type BudgetValues } from "../hooks/useBudgetSetup";

type BudgetTableProps = {
  filteredClients: ClientBudget[] | undefined;
  isLoading: boolean;
  budgets: Record<string, BudgetValues>;
  searchTerm: string;
  onBudgetChange: (clientId: string, value: string) => void;
  onAccountIdChange: (clientId: string, value: string) => void;
  onGoogleBudgetChange?: (clientId: string, value: string) => void;
  onGoogleAccountIdChange?: (clientId: string, value: string) => void;
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

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Cliente</TableHead>
            <TableHead className="w-[120px]">Plataforma</TableHead>
            <TableHead className="w-[150px]">Tipo</TableHead>
            <TableHead className={showGoogleFields ? "w-[150px]" : "w-[200px]"}>ID da Conta</TableHead>
            <TableHead className={showGoogleFields ? "w-[150px]" : "w-[200px]"}>Nome da Conta</TableHead>
            <TableHead className={showGoogleFields ? "w-[150px]" : "w-[200px]"}>Orçamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredClients.map((client) => {
            // Agrupar contas por plataforma e ordenar (primária primeiro)
            const metaAccounts = client.client_accounts
              .filter(acc => acc.platform === 'meta')
              .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
            
            const googleAccounts = client.client_accounts
              .filter(acc => acc.platform === 'google')
              .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

            const allAccounts = [...metaAccounts, ...googleAccounts];
            
            return allAccounts.map((account, index) => (
              <TableRow key={`${client.id}-${account.id}`}>
                {/* Nome do cliente apenas na primeira linha */}
                {index === 0 ? (
                  <TableCell className="font-medium" rowSpan={allAccounts.length}>
                    {client.company_name}
                  </TableCell>
                ) : null}
                
                <TableCell className="font-medium">
                  {account.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
                </TableCell>
                
                <TableCell>
                  <span className={account.is_primary ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                    {account.is_primary ? 'Principal' : 'Secundária'}
                  </span>
                </TableCell>
                
                <TableCell>
                  {account.is_primary ? (
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`account-${client.id}-${account.platform}`} className="sr-only">
                        ID da Conta {account.platform === 'meta' ? 'Meta' : 'Google'}
                      </Label>
                      <Input
                        id={`account-${client.id}-${account.platform}`}
                        placeholder="ID da conta"
                        value={account.platform === 'meta' ? 
                          (budgets[client.id]?.accountId || "") : 
                          (budgets[client.id]?.googleAccountId || "")
                        }
                        onChange={(e) => account.platform === 'meta' ? 
                          onAccountIdChange(client.id, e.target.value) :
                          onGoogleAccountIdChange!(client.id, e.target.value)
                        }
                        className="max-w-[150px]"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">{account.account_id}</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-gray-600">{account.account_name}</span>
                </TableCell>
                
                <TableCell>
                  {account.is_primary ? (
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`budget-${client.id}-${account.platform}`} className="sr-only">
                        Orçamento {account.platform === 'meta' ? 'Meta' : 'Google'} Ads
                      </Label>
                      <span className="text-gray-500">R$</span>
                      <Input
                        id={`budget-${client.id}-${account.platform}`}
                        placeholder="0,00"
                        value={account.platform === 'meta' ? 
                          (budgets[client.id]?.meta || "") : 
                          (budgets[client.id]?.googleMeta || "")
                        }
                        onChange={(e) => account.platform === 'meta' ? 
                          onBudgetChange(client.id, e.target.value) :
                          onGoogleBudgetChange!(client.id, e.target.value)
                        }
                        className="max-w-[150px]"
                        type="text"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">
                      R$ {account.budget_amount.toLocaleString('pt-BR')}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ));
          })}
        </TableBody>
      </Table>
    </div>
  );
};
