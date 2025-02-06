import { Card } from "@/components/ui/card";
import { SalaryChart } from "@/components/managers/SalaryChart";

const Financial = () => {
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-3xl font-bold text-muran-dark">
          Meu Financeiro
        </h1>
      </div>

      <Card className="p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div className="bg-muran-primary/5 rounded-lg p-3 md:p-4 border-l-4 border-muran-primary">
            <p className="text-sm md:text-base text-muran-complementary">
              Acompanhe sua evolução financeira e celebre cada conquista! 
              Na Muran, acreditamos no seu potencial e queremos fazer parte 
              da sua jornada de crescimento. 🚀
            </p>
          </div>
          <div className="w-full overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
            <div className="min-w-[600px] md:min-w-0">
              <SalaryChart />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Financial;