
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const ClientNotFound = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-6">
          <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
          <p className="text-center text-gray-500">Cliente não encontrado.</p>
        </div>
      </CardContent>
    </Card>
  );
};
