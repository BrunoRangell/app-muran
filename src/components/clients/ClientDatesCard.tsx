import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { UnifiedClient } from "@/hooks/useUnifiedData";
import { isValidDate, getNextOccurrence, getDaysUntil, getYearsToComplete } from "@/utils/dateHelpers";
import { useImportantDates } from "@/hooks/useImportantDates";
import { AddDateDialog } from "@/components/dates/AddDateDialog";
import { EditDateDialog } from "@/components/dates/EditDateDialog";
import { AllClientDatesDialog } from "@/components/dates/AllClientDatesDialog";
import { DateItem } from "@/components/dates/DateItem";
import { Handshake } from "lucide-react";
import { ImportantDate } from "@/types/importantDate";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClientDatesCardProps {
  clients: UnifiedClient[];
}

interface ClientDate {
  client?: UnifiedClient;
  date: Date;
  type: 'partnership_anniversary' | 'custom';
  daysUntil: number;
  yearsComplete?: number;
  originalDate: string;
  title?: string;
  customId?: string;
}

export const ClientDatesCard = ({ clients }: ClientDatesCardProps) => {
  const { dates: customDates, deleteDate } = useImportantDates('client');
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const getAllClientDates = (): ClientDate[] => {
    const allDates: ClientDate[] = [];
    
    clients
      .filter(client => client.status === 'active')
      .forEach(client => {
        // Aniversário de parceria
        if (isValidDate(client.first_payment_date)) {
          const nextAnniversary = getNextOccurrence(client.first_payment_date);
          const yearsComplete = getYearsToComplete(client.first_payment_date, nextAnniversary);
          allDates.push({
            client,
            date: nextAnniversary,
            type: 'partnership_anniversary',
            daysUntil: getDaysUntil(nextAnniversary),
            yearsComplete,
            originalDate: client.first_payment_date
          });
        }
      });
    
    // Adicionar datas customizadas
    customDates.forEach(customDate => {
      if (customDate.entity_type === 'client' || customDate.entity_type === 'custom') {
        const dateObj = new Date(customDate.date);
        const nextOccurrence = customDate.is_recurring ? getNextOccurrence(customDate.date) : dateObj;
        
        // Encontrar o cliente associado se houver entity_id
        const associatedClient = customDate.entity_id 
          ? clients.find(c => c.id === customDate.entity_id)
          : undefined;
        
        allDates.push({
          client: associatedClient,
          date: nextOccurrence,
          type: 'custom',
          daysUntil: getDaysUntil(nextOccurrence),
          originalDate: customDate.date,
          title: customDate.title,
          customId: customDate.id
        });
      }
    });
    
    // Ordenar por proximidade
    return allDates.sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const allClientDates = getAllClientDates();
  const clientDates = allClientDates.slice(0, 5);

  const handleDelete = async () => {
    if (deletingId) {
      await deleteDate.mutateAsync(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Building2 className="text-muran-primary" size={18} />
          Próximas Datas - Clientes
        </CardTitle>
        <AddDateDialog entityType="client" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {clientDates.map((date, index) => {
            const isCustom = date.type === 'custom';
            const customDate = isCustom ? customDates.find(d => d.id === date.customId) : null;
            
            return (
              <DateItem
                key={`${date.client?.id || date.customId}-${date.type}-${index}`}
                title={date.type === 'custom' ? date.title! : date.client?.company_name!}
                date={date.date}
                daysUntil={date.daysUntil}
                badge={
                  date.type === 'partnership_anniversary' && date.yearsComplete
                    ? {
                        label: `${date.yearsComplete} ${date.yearsComplete === 1 ? 'ano' : 'anos'} de parceria`,
                      }
                    : undefined
                }
                icon={<Handshake size={18} className="text-muran-primary" />}
                dateFormat="dd 'de' MMM 'de' yyyy"
                showActions={isCustom}
                onEdit={customDate ? () => setEditingDate(customDate) : undefined}
                onDelete={isCustom ? () => setDeletingId(date.customId!) : undefined}
              />
            );
          })}
          {clientDates.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Nenhuma data próxima encontrada
            </p>
          )}
        </div>
      </CardContent>
      {allClientDates.length > 0 && (
        <CardFooter className="pt-3">
          <AllClientDatesDialog dates={allClientDates} totalCount={allClientDates.length} />
        </CardFooter>
      )}

      {/* Edit Dialog */}
      {editingDate && (
        <EditDateDialog
          date={editingDate}
          open={!!editingDate}
          onOpenChange={(open) => !open && setEditingDate(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta data? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
