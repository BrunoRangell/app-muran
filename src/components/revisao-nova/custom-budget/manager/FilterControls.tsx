
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Calendar, ChevronDown, Grid, List } from "lucide-react";

interface FilterControlsProps {
  platformFilter: string;
  setPlatformFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  setSortBy: (value: string) => void;
  displayMode: "list" | "cards" | "calendar";
  setDisplayMode: (mode: "list" | "cards" | "calendar") => void;
}

export const FilterControls = ({
  platformFilter,
  setPlatformFilter,
  statusFilter,
  setStatusFilter,
  setSortBy,
  displayMode,
  setDisplayMode
}: FilterControlsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-4">
      <div className="flex items-center gap-2">
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas plataformas</SelectItem>
            <SelectItem value="meta">
              <div className="flex items-center">
                <Badge className="mr-2 bg-blue-500">Meta</Badge>
                Meta Ads
              </div>
            </SelectItem>
            <SelectItem value="google">
              <div className="flex items-center">
                <Badge className="mr-2 bg-red-500">Google</Badge>
                Google Ads
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="scheduled">Agendados</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="expired">Expirados</SelectItem>
            <SelectItem value="recurring">Recorrentes</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Ordenar
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy("client_name")}>
              Nome do cliente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("budget_amount_desc")}>
              Maior orçamento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("budget_amount_asc")}>
              Menor orçamento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("start_date_desc")}>
              Data de início (recente)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("end_date_asc")}>
              Próximos a expirar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("platform")}>
              Plataforma
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-center border rounded-md">
        <Button 
          variant={displayMode === "list" ? "secondary" : "ghost"} 
          size="sm" 
          className="rounded-none rounded-l-md"
          onClick={() => setDisplayMode("list")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button 
          variant={displayMode === "cards" ? "secondary" : "ghost"} 
          size="sm" 
          className="rounded-none"
          onClick={() => setDisplayMode("cards")}
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button 
          variant={displayMode === "calendar" ? "secondary" : "ghost"} 
          size="sm" 
          className="rounded-none rounded-r-md"
          onClick={() => setDisplayMode("calendar")}
        >
          <Calendar className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
