
import { Table, TableBody } from "@/components/ui/table";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaymentsTableHeader } from "./table/PaymentsTableHeader";
import { PaymentsTableRow } from "./table/PaymentsTableRow";
import { PaymentsClientListProps } from "./types";
import { usePaymentsClients } from "./hooks/usePaymentsClients";
import { usePaymentsSort } from "./hooks/usePaymentsSort";

export function PaymentsClientList({ onPaymentClick }: PaymentsClientListProps) {
  const { clients, isLoading, handlePaymentUpdated } = usePaymentsClients();
  const { 
    sortConfig, 
    searchTerm, 
    setSearchTerm, 
    handleSort, 
    filteredAndSortedClients 
  } = usePaymentsSort(clients);

  return (
    <Card className="p-2 md:p-6">
      <div className="flex flex-col space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border rounded-lg">
              <Table>
                <PaymentsTableHeader 
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <TableBody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        Carregando clientes...
                      </td>
                    </tr>
                  ) : filteredAndSortedClients?.map((client) => (
                    <PaymentsTableRow
                      key={client.id}
                      client={client}
                      onPaymentClick={onPaymentClick}
                      onPaymentUpdated={handlePaymentUpdated}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
