
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { useBudgetSetup } from "./hooks/useBudgetSetup";
import { SearchBar } from "./budget-setup/SearchBar";
import { BudgetTable } from "./budget-setup/BudgetTable";
import { SaveButton } from "./budget-setup/SaveButton";
import { AddSecondaryAccountModal } from "./budget-setup/AddSecondaryAccountModal";

export const BudgetSetupForm = () => {
  const {
    searchTerm,
    setSearchTerm,
    budgets,
    isLoading,
    saveBudgetsMutation,
    handleBudgetChange,
    handleAccountIdChange,
    handleGoogleBudgetChange,
    handleGoogleAccountIdChange,
    handleSave,
    filteredClients,
    // Novas funcionalidades
    isAddModalOpen,
    setIsAddModalOpen,
    selectedClientForAdd,
    handleAddSecondaryAccount,
    handleCreateSecondaryAccount,
    handleDeleteSecondaryAccount,
    createSecondaryAccountMutation
  } = useBudgetSetup();

  return (
    <>
      <Card className="w-full max-w-full mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="text-muran-primary" />
            Configurar Orçamentos
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
              onGoogleBudgetChange={handleGoogleBudgetChange}
              onGoogleAccountIdChange={handleGoogleAccountIdChange}
              onAddSecondaryAccount={handleAddSecondaryAccount}
              onDeleteSecondaryAccount={handleDeleteSecondaryAccount}
            />

            <SaveButton
              onSave={handleSave}
              isSaving={saveBudgetsMutation.isPending}
              isLoading={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <AddSecondaryAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreateSecondaryAccount}
        clientName={selectedClientForAdd?.name || ""}
        isLoading={createSecondaryAccountMutation.isPending}
      />
    </>
  );
};
