
import { CustomBudgetTable } from "../CustomBudgetTable";
import { CustomBudgetCards } from "../CustomBudgetCards";
import { CustomBudgetCalendar } from "../CustomBudgetCalendar";
import { ClientWithBudgets, CustomBudget } from "../../hooks/useCustomBudgets";

interface BudgetContentProps {
  displayMode: "list" | "cards" | "calendar";
  filteredClients: ClientWithBudgets[] | undefined;
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  formatDate: (date: string | Date) => string;
  formatBudget: (amount: number) => string;
  isCurrentlyActive: (budget: CustomBudget) => boolean;
  isFutureBudget: (budget: CustomBudget) => boolean;
  onEdit: (budget: CustomBudget) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onDuplicate: (budget: CustomBudget) => void;
}

export const BudgetContent = ({
  displayMode,
  filteredClients,
  isLoading,
  searchTerm,
  setSearchTerm,
  formatDate,
  formatBudget,
  isCurrentlyActive,
  isFutureBudget,
  onEdit,
  onDelete,
  onToggleStatus,
  onDuplicate
}: BudgetContentProps) => {
  if (displayMode === "calendar") {
    return (
      <CustomBudgetCalendar
        filteredClients={filteredClients}
        isLoading={isLoading}
        formatBudget={formatBudget}
        onEdit={onEdit}
      />
    );
  }
  
  if (displayMode === "cards") {
    return (
      <CustomBudgetCards
        filteredClients={filteredClients}
        isLoading={isLoading}
        formatDate={formatDate}
        formatBudget={formatBudget}
        isCurrentlyActive={isCurrentlyActive}
        isFutureBudget={isFutureBudget}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
        onDuplicate={onDuplicate}
      />
    );
  }
  
  return (
    <CustomBudgetTable
      filteredClients={filteredClients}
      isLoading={isLoading}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      formatDate={formatDate}
      formatBudget={formatBudget}
      isCurrentlyActive={isCurrentlyActive}
      isFutureBudget={isFutureBudget}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleStatus={onToggleStatus}
      onDuplicate={onDuplicate}
    />
  );
};
