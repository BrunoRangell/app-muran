
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SalaryData {
  month: string;
  amount: number;
}

interface SalaryChartProps {
  salaries: SalaryData[];
}

export const SalaryChart = ({ salaries }: SalaryChartProps) => {
  if (salaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-lg text-muran-complementary mb-2">
          Nenhum registro salarial encontrado
        </p>
        <p className="text-sm text-gray-500">
          Não existem dados de salário registrados para este período.
        </p>
      </div>
    );
  }

  // Inverte a ordem para que o mês mais antigo fique à esquerda
  const formattedData = [...salaries]
    .reverse()
    .map((item) => {
      const date = new Date(item.month);
      return {
        month: format(date, "MMM/yyyy", { locale: ptBR }),
        amount: item.amount,
      };
    });

  // Calcula o total acumulado
  const totalSalary = formattedData.reduce(
    (acc, curr) => acc + curr.amount,
    0
  );

  return (
    <div className="space-y-4">
      <div className="bg-muran-primary/10 rounded-lg px-6 py-4 border-l-4 border-muran-primary w-full md:w-auto">
        <span className="text-sm font-medium text-muran-complementary block mb-1">
          Total acumulado
        </span>
        <span className="text-2xl font-bold text-muran-primary">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(totalSalary)}
        </span>
        <span className="text-xs text-muran-complementary/80 block mt-1">
          Parabéns pelo seu progresso! 🎉
        </span>
      </div>

      <ChartContainer
        className="w-full h-[300px] md:h-[400px] mx-auto"
        config={{
          salary: {
            theme: {
              light: "#ff6e00",
              dark: "#ff6e00",
            },
          },
        }}
      >
        <LineChart
          data={formattedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fill: "#0f0f0f", fontSize: 12 }}
            tickLine={{ stroke: "#e5e7eb" }}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            tick={{ fill: "#0f0f0f", fontSize: 12 }}
            tickFormatter={(value) => `R$ ${value}`}
            tickLine={{ stroke: "#e5e7eb" }}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <ChartTooltip
            cursor={{ stroke: "#e5e7eb" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0];
              return (
                <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-100">
                  <p className="text-sm font-medium text-muran-dark">
                    {data.payload.month}
                  </p>
                  <p className="text-sm font-bold text-muran-primary">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(data.value as number)}
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            name="Salário"
            stroke="#ff6e00"
            strokeWidth={2}
            dot={{ fill: "#ff6e00", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#ff6e00" }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
};
