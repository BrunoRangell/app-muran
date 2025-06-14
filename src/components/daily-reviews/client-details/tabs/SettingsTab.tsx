
import { ClientBudgetSettings } from "../../ClientBudgetSettings";

interface SettingsTabProps {
  clientId: string;
  clientName: string;
  currentBudget: number;
}

export const SettingsTab = ({ clientId, clientName, currentBudget }: SettingsTabProps) => {
  return (
    <div className="space-y-4">
      <ClientBudgetSettings
        clientId={clientId}
        clientName={clientName}
        currentBudget={currentBudget}
      />
    </div>
  );
};
