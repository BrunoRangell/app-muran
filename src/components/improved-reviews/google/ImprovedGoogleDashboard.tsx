
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const ImprovedGoogleDashboard = () => {
  return (
    <Card>
      <CardContent className="p-8">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Google Ads Dashboard</AlertTitle>
          <AlertDescription>
            A implementação completa do Google Ads Dashboard será adicionada na próxima fase.
            Esta seção terá funcionalidades similares ao dashboard do Meta Ads, mas adaptadas para Google Ads.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
