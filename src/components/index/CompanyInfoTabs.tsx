import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Target, Heart, Sparkles } from "lucide-react";

export const CompanyInfoTabs = () => {
  // Por ora, usando dados estáticos até verificar estrutura do banco
  const company = {
    mission: "Transformar negócios através de estratégias digitais inovadoras e personalizadas.",
    vision: "Ser referência em marketing digital, reconhecida pela excelência e resultados excepcionais.",
    values: "• Inovação constante\n• Foco em resultados\n• Transparência com clientes\n• Trabalho em equipe\n• Aprendizado contínuo"
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Building2 className="text-muran-primary h-5 w-5" />
          Sobre a Muran
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mission" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mission" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Missão
            </TabsTrigger>
            <TabsTrigger value="vision" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Visão
            </TabsTrigger>
            <TabsTrigger value="values" className="text-xs">
              <Heart className="h-3 w-3 mr-1" />
              Valores
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="mission" className="mt-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {company.mission}
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="vision" className="mt-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {company.vision}
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="values" className="mt-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {company.values}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
