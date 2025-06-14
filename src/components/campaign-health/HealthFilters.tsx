
import { useCampaignHealthData } from "./hooks/useCampaignHealthData";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function HealthFilters() {
  const { filterValue, setFilterValue } = useCampaignHealthData();
  const [local, setLocal] = useState(filterValue);

  return (
    <div className="mb-5 flex gap-2">
      <Input
        placeholder="Buscar cliente..."
        className="max-w-xs"
        value={local}
        onChange={e => {
          setLocal(e.target.value);
          setFilterValue(e.target.value);
        }}
      />
      {/* Filtros futuros como status/plataforma */}
    </div>
  );
}
