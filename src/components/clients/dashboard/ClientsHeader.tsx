
import { Button } from "@/components/ui/button";
import { Plus, Download, Settings } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ClientForm } from "@/components/admin/ClientForm";

export const ClientsHeader = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleExport = () => {
    console.log("Exportar dados dos clientes");
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-muran-dark mb-2">
            Gestão de Clientes
          </h1>
          <p className="text-gray-600">
            Gerencie seus clientes, acompanhe métricas e analise performance
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-muran-primary/20 hover:bg-muran-primary/5"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-muran-primary hover:bg-muran-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <ClientForm
            initialData={null}
            onSuccess={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
