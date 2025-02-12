
import { FinancialMetrics } from "@/components/clients/FinancialMetrics";

const FinancialReport = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
          Relatório Financeiro
        </h1>
      </div>
      <FinancialMetrics />
    </div>
  );
};

export default FinancialReport;
