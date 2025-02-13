
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";

export function ImportCostsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar OFX
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar custos do OFX</DialogTitle>
          <DialogDescription>
            Selecione um arquivo OFX do seu banco para importar as transações como custos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          Em construção...
        </div>
      </DialogContent>
    </Dialog>
  );
}
