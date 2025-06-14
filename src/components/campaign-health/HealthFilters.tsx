
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HealthFiltersProps {
  platformFilter: "all" | "meta" | "google";
  statusFilter: "all" | "problems" | "normal";
  onPlatformChange: (value: "all" | "meta" | "google") => void;
  onStatusChange: (value: "all" | "problems" | "normal") => void;
}

export function HealthFilters({
  platformFilter,
  statusFilter,
  onPlatformChange,
  onStatusChange,
}: HealthFiltersProps) {
  return (
    <div className="flex gap-3">
      <Select value={platformFilter} onValueChange={onPlatformChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Plataforma" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="meta">Meta Ads</SelectItem>
          <SelectItem value="google">Google Ads</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="problems">Com problemas</SelectItem>
          <SelectItem value="normal">Normais</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
