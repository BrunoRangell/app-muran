
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";

export const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={6} className="text-center py-6 text-gray-500">
      Nenhum cliente encontrado
    </TableCell>
  </TableRow>
);
