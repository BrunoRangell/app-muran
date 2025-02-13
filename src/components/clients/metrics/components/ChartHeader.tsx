
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PeriodFilter } from "../../types";

interface ChartHeaderProps {
  title?: string;
  periodFilter: PeriodFilter;
  onPeriodChange: (value: PeriodFilter) => void;
}

export const ChartHeader = ({ title, periodFilter, onPeriodChange }: ChartHeaderProps) => {
  const hasTitle = title && title.length > 0;

  return (
    <>
      {hasTitle && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-muran-dark">{title}</h3>
        </div>
      )}
      
      <div className="flex justify-end">
        <Select value={periodFilter} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
            <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
            <SelectItem value="last-12-months">Últimos 12 meses</SelectItem>
            <SelectItem value="last-24-months">Últimos 24 meses</SelectItem>
            <SelectItem value="this-year">Este ano</SelectItem>
            <SelectItem value="last-year">Ano passado</SelectItem>
            <SelectItem value="custom">Data personalizada</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
