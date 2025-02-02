import { Card } from "@/components/ui/card";
import { SalaryChart } from "@/components/managers/SalaryChart";

const Financial = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-muran-dark">Meu Financeiro</h1>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="bg-muran-primary/5 rounded-lg p-4 border-l-4 border-muran-primary">
            <p className="text-muran-complementary text-lg">
              Acompanhe sua evolução financeira e celebre cada conquista! 
              Na Muran, acreditamos no seu potencial e queremos fazer parte 
              da sua jornada de crescimento. 🚀
            </p>
          </div>
          <SalaryChart />
        </div>
      </Card>
    </div>
  );
};

export default Financial;