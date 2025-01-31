import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Column } from "../types";

interface ColumnToggleProps {
  columns: Column[];
  onToggleColumn: (columnId: string) => void;
}

export const ColumnToggle = ({ columns, onToggleColumn }: ColumnToggleProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Colunas visíveis</h4>
          <div className="space-y-2">
            {columns.map(column => (
              <div key={column.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={column.id} 
                  checked={column.show}
                  onCheckedChange={() => onToggleColumn(column.id)}
                />
                <label 
                  htmlFor={column.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {column.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};