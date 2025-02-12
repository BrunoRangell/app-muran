
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { ClientsList } from "@/components/clients/ClientsList";
import { FinancialMetrics } from "@/components/clients/FinancialMetrics";
import { 
  Users, 
  DollarSign, 
  ChevronDown,
  Receipt,
  CreditCard,
  BarChart
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    id: 'financial-report',
    label: 'Relatório Financeiro',
    icon: DollarSign,
    content: <FinancialMetrics />,
  },
  {
    id: 'clients',
    label: 'Clientes',
    icon: Users,
    content: <ClientsList />,
  },
  {
    id: 'receivables',
    label: 'Recebimentos',
    icon: Receipt,
    content: <div className="p-4 text-gray-500">Em desenvolvimento</div>,
  },
  {
    id: 'costs',
    label: 'Registro de Custos',
    icon: CreditCard,
    content: <div className="p-4 text-gray-500">Em desenvolvimento</div>,
  },
  {
    id: 'metrics',
    label: 'Relatórios e Métricas',
    icon: BarChart,
    content: <div className="p-4 text-gray-500">Em desenvolvimento</div>,
  },
];

const Clients = () => {
  const [openSections, setOpenSections] = useState<string[]>(['financial-report']);

  const toggleSection = (id: string) => {
    setOpenSections(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
          Financeiro Muran
        </h1>
      </div>

      <div className="space-y-4">
        {menuItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <Collapsible
              open={openSections.includes(item.id)}
              onOpenChange={() => toggleSection(item.id)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-5 w-5 text-muran-primary" />
                    <span className="font-medium text-muran-dark">
                      {item.label}
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 text-muran-primary transition-transform",
                    openSections.includes(item.id) && "transform rotate-180"
                  )} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t">
                  {item.content}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Clients;
