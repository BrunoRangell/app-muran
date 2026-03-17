import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Settings, AlertTriangle, Users, Layers } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type AllPlatformsFilter = "" | "adjustments" | "campaigns" | "without-account";
export type PlatformFilter = "all" | "meta" | "google";

interface AllPlatformsFilterBarProps {
  searchQuery: string;
  activeFilter: AllPlatformsFilter;
  platformFilter: PlatformFilter;
  onSearchChange: (query: string) => void;
  onActiveFilterChange: (filter: AllPlatformsFilter) => void;
  onPlatformFilterChange: (platform: PlatformFilter) => void;
}

export function AllPlatformsFilterBar({
  searchQuery,
  activeFilter,
  platformFilter,
  onSearchChange,
  onActiveFilterChange,
  onPlatformFilterChange,
}: AllPlatformsFilterBarProps) {
  return (
    <Card className="shadow-sm sticky top-0 z-30 bg-background">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar clientes em todas as plataformas..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Common filters */}
            <ToggleGroup
              type="single"
              value={activeFilter}
              onValueChange={(value) => onActiveFilterChange((value || "") as AllPlatformsFilter)}
              className="h-8"
            >
              <ToggleGroupItem
                value="adjustments"
                className="h-8 px-3 text-xs gap-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md"
              >
                <Settings className="h-3 w-3" />
                Ajuste de orçamento
              </ToggleGroupItem>
              <ToggleGroupItem
                value="campaigns"
                className="h-8 px-3 text-xs gap-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md"
              >
                <AlertTriangle className="h-3 w-3" />
                Campanhas com problemas
              </ToggleGroupItem>
              <ToggleGroupItem
                value="without-account"
                className="h-8 px-3 text-xs gap-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md"
              >
                <Users className="h-3 w-3" />
                Sem conta cadastrada
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Platform toggle */}
            <div className="flex items-center gap-2 ml-auto">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <ToggleGroup
                type="single"
                value={platformFilter}
                onValueChange={(value) => value && onPlatformFilterChange(value as PlatformFilter)}
                className="h-8"
              >
                <ToggleGroupItem
                  value="all"
                  className="h-8 px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md"
                >
                  Todas
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="meta"
                  className="h-8 px-3 text-xs data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-md"
                >
                  Meta
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="google"
                  className="h-8 px-3 text-xs data-[state=on]:bg-amber-600 data-[state=on]:text-white data-[state=on]:shadow-md"
                >
                  Google
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
