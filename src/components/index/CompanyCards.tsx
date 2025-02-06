import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Users, ArrowUpRight } from "lucide-react";

export const CompanyCards = () => {
  return (
    <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <Card className="transform transition-all hover:scale-105">
        <CardHeader className="p-3 md:p-4">
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <Target className="text-muran-primary h-4 w-4" />
            Nossa Missão
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
          <p className="text-xs md:text-sm text-gray-600">
            Contribuir para o impulsionamento de negócios no mundo digital,
            assessorando empreendedores com transparência, leveza e
            comprometimento e construindo parcerias duradouras.
          </p>
        </CardContent>
      </Card>

      <Card className="transform transition-all hover:scale-105">
        <CardHeader className="p-3 md:p-4">
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <Users className="text-muran-primary h-4 w-4" />
            Nossos Valores
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
          <ul className="list-disc list-inside text-xs md:text-sm text-gray-600 space-y-0.5 md:space-y-1">
            <li>Agilidade</li>
            <li>Colaboração</li>
            <li>Comprometimento</li>
            <li>Excelência</li>
            <li>Flexibilidade</li>
            <li>Transparência</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="transform transition-all hover:scale-105 md:col-span-2 lg:col-span-1">
        <CardHeader className="p-3 md:p-4">
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <ArrowUpRight className="text-muran-primary h-4 w-4" />
            Nossa Visão
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
          <p className="text-xs md:text-sm text-gray-600">
            Prestar serviços de excelência em marketing digital, contribuindo para
            a prosperidade de clientes e almejando tornar-se referência no nicho.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};