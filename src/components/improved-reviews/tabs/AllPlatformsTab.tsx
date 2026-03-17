import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Layers } from "lucide-react";
import { useAllPlatformsData } from "../hooks/useAllPlatformsData";
import { ClientCard } from "../clients/ClientCard";
import { ImprovedLoadingState } from "../common/ImprovedLoadingState";
import { EmptyState } from "../common/EmptyState";
import { AllPlatformsFilterBar } from "../filters/AllPlatformsFilterBar";
import { useMemo } from "react";

export function AllPlatformsTab() {
  const {
    groups,
    metrics,
    isLoading,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    platformFilter,
    setPlatformFilter,
    considerTaxes,
    setConsiderTaxes,
    budgetCalculationMode,
    setBudgetCalculationMode,
  } = useAllPlatformsData();

  // Flatten all accounts into a single list for grid display
  const flatAccounts = useMemo(() => {
    return groups.flatMap((group) =>
      group.accounts.map((acc) => ({
        ...acc,
        clientName: group.clientName,
        clientId: group.clientId,
      }))
    );
  }, [groups]);

  if (isLoading) {
    return <ImprovedLoadingState />;
  }

  return (
    <div className="space-y-4">
      {/* Metrics summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Clientes</p>
              <p className="text-xl font-bold">{metrics.totalClients}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Contas</p>
              <p className="text-xl font-bold">{metrics.totalAccounts}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Meta</Badge>
            <p className="text-xl font-bold">{metrics.metaAccounts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Google</Badge>
            <p className="text-xl font-bold">{metrics.googleAccounts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <AllPlatformsFilterBar
        searchQuery={searchQuery}
        activeFilter={activeFilter}
        platformFilter={platformFilter}
        considerTaxes={considerTaxes}
        budgetCalculationMode={budgetCalculationMode}
        onSearchChange={setSearchQuery}
        onActiveFilterChange={setActiveFilter}
        onPlatformFilterChange={setPlatformFilter}
        onConsiderTaxesChange={setConsiderTaxes}
        onBudgetCalculationModeChange={setBudgetCalculationMode}
      />

      {/* Flat grid of all account cards */}
      {flatAccounts.length === 0 ? (
        <EmptyState title="Nenhum cliente encontrado" description="Tente buscar por outro nome ou altere os filtros" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {flatAccounts.map((acc) => (
            <ClientCard
              key={`${acc.clientId}-${acc.platform}`}
              client={acc.clientData}
              platform={acc.platform}
              considerTaxes={considerTaxes}
              budgetCalculationMode={budgetCalculationMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
