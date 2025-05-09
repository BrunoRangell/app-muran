
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { AlertCircle } from "lucide-react";

export const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={6} className="text-center py-8">
      <div className="flex flex-col items-center justify-center space-y-2">
        <AlertCircle className="h-8 w-8 text-amber-500" />
        <p className="text-gray-500 font-medium">Nenhum cliente encontrado ou dados não disponíveis</p>
        <p className="text-sm text-gray-400">
          Tente usar o botão "Analisar" para buscar dados atualizados
        </p>
      </div>
    </TableCell>
  </TableRow>
);
