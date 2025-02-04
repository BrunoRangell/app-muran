import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
}

export const DatePicker = ({ selected, onSelect, className }: DatePickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[240px] justify-start text-left font-normal bg-[#0f0f15] border-[#ff6e00]/20 hover:bg-[#ff6e00]/10 hover:border-[#ff6e00]/30",
            !selected && "text-[#ff914d]/70",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#ff914d]" />
          {selected ? format(selected, "PPP") : <span>Selecione uma data</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-[#0f0f15] border-[#ff6e00]/20">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          initialFocus
          className="text-white"
          classNames={{
            day: "text-white hover:bg-[#ff6e00]/20",
            day_selected: "bg-[#ff6e00] hover:bg-[#ff6e00]/90",
            day_today: "border border-[#ff6e00]",
            head_cell: "text-[#ff914d]",
            nav_button: "text-[#ff914d] hover:bg-[#ff6e00]/10",
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
