
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Save, Loader } from "lucide-react";
import { useBudgetManager } from "./hooks/useBudgetManager";

export const BudgetManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { 
    clients, 
    isLoading, 
    budgets, 
    handleBudgetChange, 
    handleAccountIdChange, 
    handleSave, 
    isSaving 
  } = useBudgetManager();

  // Filtrar clientes com base no termo de busca
  const filteredClients = clients?.filter(client => 
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Novo handler para input que lida diretamente com o valor sem limitações
  const handleBudgetInputChange = (clientId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    handleBudgetChange(clientId, e.target.value);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl text-muran-dark flex items-center gap-2">
          Gerenciamento de Orçamentos Meta Ads
        </CardTitle>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader className="h-8 w-8 animate-spin text-muran-primary" />
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Cliente</TableHead>
                    <TableHead className="w-[30%]">ID Conta Meta Ads</TableHead>
                    <TableHead className="w-[30%]">Orçamento Mensal (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-gray-500">
                        Nenhum cliente encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients?.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.company_name}</TableCell>
                        <TableCell>
                          <Input
                            value={budgets[client.id]?.accountId || ""}
                            onChange={(e) => handleAccountIdChange(client.id, e.target.value)}
                            placeholder="ID da conta"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={budgets[client.id]?.displayBudget || ""}
                            onChange={(e) => handleBudgetInputChange(client.id, e)}
                            placeholder="0,00"
                            className="text-right"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={isLoading || isSaving}
                className="bg-muran-primary hover:bg-muran-primary/90"
              >
                {isSaving ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar alterações
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
