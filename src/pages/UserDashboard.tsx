import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { X } from "lucide-react";

const UserDashboard = () => {
  const [showAlert, setShowAlert] = useState(true);

  return (
    <div className="space-y-6">
      {showAlert && (
        <Alert className="relative">
          <AlertDescription>
            Bem-vindo ao seu painel! Aqui você encontrará um resumo das suas informações e atividades.
          </AlertDescription>
          <button
            onClick={() => setShowAlert(false)}
            className="absolute top-2 right-2 p-1 hover:bg-secondary rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}
      
      <h1 className="text-3xl font-bold text-muran-complementary">Painel do Usuário</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Área Financeira</CardTitle>
            <DollarSign className="h-4 w-4 text-muran-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Acesse suas informações financeiras e relatórios no menu lateral.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipe</CardTitle>
            <Users className="h-4 w-4 text-muran-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Visualize informações sobre a equipe e gestores no menu lateral.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;