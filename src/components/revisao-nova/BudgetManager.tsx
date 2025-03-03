
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Save, Loader, Info } from "lucide-react";
import { useBudgetManager } from "./hooks/useBudgetManager";
import { useToast } from "@/hooks/use-toast";

export const BudgetManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { 
    clients, 
    isLoading, 
    budgets, 
    handleBudgetChange, 
    handleBudgetBlur,
    handleAccountIdChange, 
    handleSave, 
    isSaving,
    totalBudget 
  } = useBudgetManager();

  // Filtrar clientes com base no termo de busca
  const filteredClients = clients?.filter(client => 
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleHelpClick = () => {
    toast({
      title: "Dica de uso",
      description: "Digite os valores diretamente no campo de orçamento. O valor será formatado automaticamente quando você clicar fora do campo.",
    });
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl text-muran-dark flex items-center gap-2">
              Gerenciamento de Orçamentos Meta Ads
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6 rounded-full" 
                onClick={handleHelpClick}
              >
                <Info className="h-4 w-4 text-muran-primary" />
              </Button>
            </CardTitle>
            <CardDescription className="mt-1">
              Configure os orçamentos mensais e IDs de contas para cada cliente
            </CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader className="h-8 w-8 animate-spin text-muran-primary" />
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
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
                      <TableRow key={client.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{client.company_name}</TableCell>
                        <TableCell>
                          <Input
                            value={budgets[client.id]?.accountId || ""}
                            onChange={(e) => handleAccountIdChange(client.id, e.target.value)}
                            placeholder="ID da conta"
                            className="bg-white"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={budgets[client.id]?.formattedValue || ""}
                            onChange={(e) => handleBudgetChange(client.id, e.target.value)}
                            onBlur={() => handleBudgetBlur(client.id)}
                            placeholder="R$ 0,00"
                            className="text-right bg-white"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="text-right font-medium">
                      Total de Orçamentos:
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {totalBudget}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={isLoading || isSaving}
                className="bg-muran-primary hover:bg-muran-primary/90 font-medium"
                size="lg"
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
