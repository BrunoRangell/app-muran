
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { useBudgetSetup } from "./hooks/useBudgetSetup";
import { SearchBar } from "./budget-setup/SearchBar";
import { BudgetTable } from "./budget-setup/BudgetTable";
import { SaveButton } from "./budget-setup/SaveButton";
import { AddSecondaryAccountModal } from "./budget-setup/AddSecondaryAccountModal";
import { DeleteAccountDialog } from "./budget-setup/DeleteAccountDialog";

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
    temporaryAccounts,
    // Novas funcionalidades
    isAddModalOpen,
    setIsAddModalOpen,
    selectedClientForAdd,
    handleAddSecondaryAccount,
    handleCreateSecondaryAccount,
    handleDeleteSecondaryAccount,
    createSecondaryAccountMutation,
    // Estados do diálogo de confirmação
    deleteDialogOpen,
    setDeleteDialogOpen,
    accountToDelete,
    confirmDeleteAccount
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
              temporaryAccounts={temporaryAccounts}
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

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteAccount}
        accountName={accountToDelete?.name}
      />
    </>
  );
};
