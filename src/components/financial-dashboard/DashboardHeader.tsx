
import { BarChart3, Filter } from "lucide-react";
import { UnifiedDashboardHeader } from "@/components/common/UnifiedDashboardHeader";

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const DashboardHeader = ({ 
  onToggleSidebar, 
  sidebarOpen 
}: DashboardHeaderProps) => {
  return (
    <UnifiedDashboardHeader
      title="Dashboard Financeiro"
      description="Análise completa dos indicadores financeiros da Muran Digital"
      icon={BarChart3}
      badge={{
        text: "Tempo Real",
        variant: "secondary"
      }}
      actions={[
        {
          label: "Filtros",
          onClick: onToggleSidebar,
          variant: sidebarOpen ? 'default' : 'outline',
          icon: Filter
        }
      ]}
    />
  );
};
