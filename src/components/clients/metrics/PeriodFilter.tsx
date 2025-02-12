
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PeriodFilter as PeriodFilterType } from "../types";

interface PeriodFilterProps {
  value: PeriodFilterType;
  onValueChange: (value: PeriodFilterType) => void;
}

export const PeriodFilter = ({ value, onValueChange }: PeriodFilterProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
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
  );
};
