
import { CustomBudgetManager } from "@/components/revisao-nova/CustomBudgetManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Calendar, ListFilter, LayoutGrid } from "lucide-react";

export function CustomBudgetTab() {
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "cards">("list");
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-semibold">Orçamentos Personalizados</h2>
        
        <div className="flex items-center space-x-2 bg-secondary rounded-lg p-1">
          <button 
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md ${viewMode === "list" ? "bg-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
            title="Visualização em lista"
          >
            <ListFilter className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setViewMode("cards")}
            className={`p-2 rounded-md ${viewMode === "cards" ? "bg-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
            title="Visualização em cards"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setViewMode("calendar")}
            className={`p-2 rounded-md ${viewMode === "calendar" ? "bg-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
            title="Visualização em calendário"
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {viewMode === "list" && <CustomBudgetManager />}
      {viewMode === "cards" && <CustomBudgetManager viewMode="cards" />}
      {viewMode === "calendar" && <CustomBudgetManager viewMode="calendar" />}
    </div>
  );
}
