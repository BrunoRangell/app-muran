
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { useBudgetSetup } from "./hooks/useBudgetSetup";
import { SearchBar } from "./budget-setup/SearchBar";
import { BudgetTable } from "./budget-setup/BudgetTable";
import { SaveButton } from "./budget-setup/SaveButton";

export const BudgetSetupForm = () => {
  const {
    searchTerm,
    setSearchTerm,
    budgets,
    isLoading,
    saveBudgetsMutation,
    handleBudgetChange,
    handleAccountIdChange,
    handleSave,
    filteredClients
  } = useBudgetSetup();

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="text-muran-primary" />
          Configurar Orçamentos Meta Ads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <SearchBar 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
          />

          <BudgetTable
            filteredClients={filteredClients}
            isLoading={isLoading}
            budgets={budgets}
            searchTerm={searchTerm}
            onBudgetChange={handleBudgetChange}
            onAccountIdChange={handleAccountIdChange}
          />

          <SaveButton
            onSave={handleSave}
            isSaving={saveBudgetsMutation.isPending}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
};
