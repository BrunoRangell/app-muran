import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Users, ArrowUpRight } from "lucide-react";

export const CompanyCards = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="transform transition-all hover:scale-105">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="text-muran-primary" />
            Nossa Missão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Contribuir para o impulsionamento de negócios no mundo digital,
            assessorando empreendedores com transparência, leveza e
            comprometimento e construindo parcerias duradouras.
          </p>
        </CardContent>
      </Card>

      <Card className="transform transition-all hover:scale-105">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="text-muran-primary" />
            Nossos Valores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Agilidade</li>
            <li>Colaboração</li>
            <li>Comprometimento</li>
            <li>Excelência</li>
            <li>Flexibilidade</li>
            <li>Transparência</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="transform transition-all hover:scale-105">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="text-muran-primary" />
            Nossa Visão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Prestar serviços de excelência em marketing digital, contribuindo para
            a prosperidade de clientes e almejando tornar-se referência no nicho.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};