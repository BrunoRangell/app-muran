
import { useState } from "react";

interface UseViewModeControlsProps {
  initialViewMode?: "list" | "cards" | "calendar";
}

export function useViewModeControls({ initialViewMode = "list" }: UseViewModeControlsProps) {
  const [displayMode, setDisplayMode] = useState<"list" | "cards" | "calendar">(initialViewMode);
  const [sortBy, setSortBy] = useState<string>("client_name");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  
  return {
    displayMode,
    setDisplayMode,
    sortBy,
    setSortBy,
    statusFilter,
    setStatusFilter,
    platformFilter,
    setPlatformFilter
  };
}
