import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Layers } from "lucide-react";
import { useAllPlatformsData } from "../hooks/useAllPlatformsData";
import { ClientGroupCard } from "../clients/ClientGroupCard";
import { ImprovedLoadingState } from "../common/ImprovedLoadingState";
import { EmptyState } from "../common/EmptyState";

export function AllPlatformsTab() {
  const { groups, metrics, isLoading, searchQuery, setSearchQuery } =
    useAllPlatformsData();

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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Client groups */}
      {groups.length === 0 ? (
        <EmptyState message="Nenhum cliente encontrado" />
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <ClientGroupCard
              key={group.clientId}
              clientName={group.clientName}
              accounts={group.accounts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
