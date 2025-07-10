
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
            <TableHead className={showGoogleFields ? "w-[150px]" : "w-[200px]"}>ID da Conta Meta</TableHead>
            <TableHead className={showGoogleFields ? "w-[150px]" : "w-[200px]"}>Orçamento Meta Ads</TableHead>
            {showGoogleFields && (
              <>
                <TableHead className="w-[150px]">ID da Conta Google</TableHead>
                <TableHead className="w-[150px]">Orçamento Google Ads</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredClients.map((client) => {
            // Organizar contas por plataforma com primárias primeiro
            const metaAccounts = client.client_accounts
              .filter(acc => acc.platform === 'meta')
              .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
            
            const googleAccounts = client.client_accounts
              .filter(acc => acc.platform === 'google')
              .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

            const maxAccounts = Math.max(metaAccounts.length, showGoogleFields ? googleAccounts.length : 0, 1);
            
            return Array.from({ length: maxAccounts }, (_, index) => {
              const metaAccount = metaAccounts[index];
              const googleAccount = showGoogleFields ? googleAccounts[index] : undefined;
              const isFirstRow = index === 0;
              
              return (
                <TableRow key={`${client.id}-${index}`} className={!isFirstRow ? "border-t-0" : ""}>
                  <TableCell className={`font-medium ${!isFirstRow ? "text-transparent border-l-2 border-gray-200 pl-4" : ""}`}>
                    {isFirstRow ? client.company_name : ""}
                  </TableCell>
                  <TableCell>
                    {metaAccount && (
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`account-${metaAccount.id}`} className="sr-only">
                          ID da Conta Meta
                        </Label>
                            <Input
                              id={`account-${metaAccount.id}`}
                              placeholder="ID da conta"
                              value={budgets[metaAccount.id]?.account_id || ""}
                              onChange={(e) => onAccountIdChange(metaAccount.id, e.target.value)}
                              className="max-w-[150px]"
                            />
                        {!metaAccount.is_primary && (
                          <span className="text-xs text-gray-500 ml-1">Sec.</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {metaAccount && (
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`meta-${metaAccount.id}`} className="sr-only">
                          Orçamento Meta Ads
                        </Label>
                        <span className="text-gray-500">R$</span>
                        <Input
                          id={`meta-${metaAccount.id}`}
                          placeholder="0,00"
                          value={budgets[metaAccount.id]?.budget_amount || ""}
                          onChange={(e) => onBudgetChange(metaAccount.id, e.target.value)}
                          className="max-w-[150px]"
                          type="text"
                        />
                      </div>
                    )}
                  </TableCell>
                  {showGoogleFields && (
                    <>
                      <TableCell>
                        {googleAccount && (
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`google-account-${googleAccount.id}`} className="sr-only">
                              ID da Conta Google
                            </Label>
                            <Input
                              id={`google-account-${googleAccount.id}`}
                              placeholder="ID da conta Google"
                              value={budgets[googleAccount.id]?.account_id || ""}
                              onChange={(e) => onGoogleAccountIdChange!(googleAccount.id, e.target.value)}
                              className="max-w-[150px]"
                            />
                            {!googleAccount.is_primary && (
                              <span className="text-xs text-gray-500 ml-1">Sec.</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {googleAccount && (
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`google-${googleAccount.id}`} className="sr-only">
                              Orçamento Google Ads
                            </Label>
                            <span className="text-gray-500">R$</span>
                            <Input
                              id={`google-${googleAccount.id}`}
                              placeholder="0,00"
                              value={budgets[googleAccount.id]?.budget_amount || ""}
                              onChange={(e) => onGoogleBudgetChange!(googleAccount.id, e.target.value)}
                              className="max-w-[150px]"
                              type="text"
                            />
                          </div>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            });
          })}
        </TableBody>
      </Table>
    </div>
  );
};
