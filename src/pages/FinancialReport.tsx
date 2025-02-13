
import { CostFilters } from "@/types/cost";
import { useState } from "react";
import { DateFilter } from "@/components/costs/filters/DateFilter";

const FinancialReport = () => {
  const [filters, setFilters] = useState<CostFilters>({});

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
          Relatório Financeiro
        </h1>
      </div>

      <div className="flex justify-end">
        <DateFilter filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Conteúdo do relatório será implementado aqui */}
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-500 text-center">
          Em desenvolvimento
        </p>
      </div>
    </div>
  );
};

export default FinancialReport;
