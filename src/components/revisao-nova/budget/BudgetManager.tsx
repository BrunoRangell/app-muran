
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BudgetHeader } from "./components/BudgetHeader";
import { BudgetTable } from "./components/BudgetTable";
import { SaveButton } from "./components/SaveButton";
import { BudgetLoadingState } from "./components/BudgetLoadingState";
import { useBudgetManager } from "../hooks/useBudgetManager";
import { useToast } from "@/hooks/use-toast";

export const BudgetManager = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();
  const { 
    clients, 
    isLoading, 
    budgets, 
    handleBudgetChange, 
    handleBudgetBlur,
    handleAccountIdChange, 
    handleGoogleBudgetChange,
    handleGoogleAccountIdChange,
    handleSave, 
    isSaving,
    totalBudget,
    totalGoogleBudget,
    addSecondaryAccount
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
        <BudgetHeader 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          onHelpClick={handleHelpClick}
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <BudgetLoadingState />
        ) : (
          <>
            <BudgetTable 
              filteredClients={filteredClients}
              budgets={budgets}
              handleBudgetChange={handleBudgetChange}
              handleBudgetBlur={handleBudgetBlur}
              handleAccountIdChange={handleAccountIdChange}
              handleGoogleBudgetChange={handleGoogleBudgetChange}
              handleGoogleAccountIdChange={handleGoogleAccountIdChange}
              addSecondaryAccount={addSecondaryAccount}
              totalBudget={totalBudget}
              totalGoogleBudget={totalGoogleBudget}
            />

            <SaveButton 
              isLoading={isLoading} 
              isSaving={isSaving} 
              onSave={handleSave} 
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetManager;
