import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const Mensagem = () => {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-muran-primary" />
            Mensagem Especial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-muted-foreground">
            Tenha um dia maravilhoso e cheio de conquistas! ✨
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Mensagem;

