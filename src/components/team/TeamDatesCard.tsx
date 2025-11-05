import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { TeamMember } from "@/types/team";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { isValidDate, getNextOccurrence, getDaysUntil, getYearsToComplete } from "@/utils/dateHelpers";
import { useImportantDates } from "@/hooks/useImportantDates";
import { AddDateDialog } from "@/components/dates/AddDateDialog";
import { EditDateDialog } from "@/components/dates/EditDateDialog";
import { AllTeamDatesDialog } from "@/components/dates/AllTeamDatesDialog";
import { DateItem } from "@/components/dates/DateItem";
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

interface TeamDatesCardProps {
  members: TeamMember[];
}

interface TeamDate {
  member?: TeamMember;
  date: Date;
  type: 'birthday' | 'work_anniversary' | 'custom';
  daysUntil: number;
  yearsComplete?: number;
  originalDate?: string;
  title?: string;
  customId?: string;
}

export const TeamDatesCard = ({ members }: TeamDatesCardProps) => {
  const { dates: customDates, deleteDate } = useImportantDates('team');
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const getAllTeamDates = (): TeamDate[] => {
    const allDates: TeamDate[] = [];
    
    members.forEach(member => {
      // Aniversário pessoal
      if (isValidDate(member.birthday)) {
        const nextBirthday = getNextOccurrence(member.birthday);
        allDates.push({
          member,
          date: nextBirthday,
          type: 'birthday',
          daysUntil: getDaysUntil(nextBirthday)
        });
      }
      
      // Aniversário de Muran
      if (isValidDate(member.start_date)) {
        const nextWorkAnniversary = getNextOccurrence(member.start_date);
        const yearsComplete = getYearsToComplete(member.start_date, nextWorkAnniversary);
        allDates.push({
          member,
          date: nextWorkAnniversary,
          type: 'work_anniversary',
          daysUntil: getDaysUntil(nextWorkAnniversary),
          yearsComplete,
          originalDate: member.start_date
        });
      }
    });
    
    // Adicionar datas customizadas
    customDates.forEach(customDate => {
      if (customDate.entity_type === 'team' || customDate.entity_type === 'custom') {
        const dateObj = new Date(customDate.date);
        const nextOccurrence = customDate.is_recurring ? getNextOccurrence(customDate.date) : dateObj;
        
        // Encontrar o membro associado se houver entity_id
        const associatedMember = customDate.entity_id 
          ? members.find(m => m.id === customDate.entity_id)
          : undefined;
        
        allDates.push({
          member: associatedMember,
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

  const allTeamDates = getAllTeamDates();
  const teamDates = allTeamDates.slice(0, 5);

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
          <Gift className="text-muran-primary" size={18} />
          Datas da Equipe
        </CardTitle>
        <AddDateDialog entityType="team" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {teamDates.map((date, index) => {
            const isCustom = date.type === 'custom';
            const customDate = isCustom ? customDates.find(d => d.id === date.customId) : null;
            
            const badgeLabel = 
              date.type === 'birthday' 
                ? 'Aniversário' 
                : date.type === 'work_anniversary'
                ? `${date.yearsComplete} ${date.yearsComplete === 1 ? 'ano' : 'anos'} de Muran`
                : 'Data Especial';
            
            const dateFormatString = date.type === 'birthday' ? "dd 'de' MMM" : "dd 'de' MMM 'de' yyyy";
            
            return (
              <DateItem
                key={`${date.member?.id || date.customId}-${date.type}-${index}`}
                title={date.type === 'custom' ? date.title! : date.member?.name!}
                date={date.date}
                daysUntil={date.daysUntil}
                badge={{ label: badgeLabel }}
                avatarUrl={date.member?.photo_url}
                avatarFallback={date.member ? getInitials(date.member.name) : '📅'}
                dateFormat={dateFormatString}
                showActions={isCustom}
                onEdit={customDate ? () => setEditingDate(customDate) : undefined}
                onDelete={isCustom ? () => setDeletingId(date.customId!) : undefined}
              />
            );
          })}
          {teamDates.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Nenhuma data próxima encontrada
            </p>
          )}
        </div>
      </CardContent>
      {allTeamDates.length > 0 && (
        <CardFooter className="pt-3">
          <AllTeamDatesDialog 
            dates={allTeamDates} 
            totalCount={allTeamDates.length}
            getInitials={getInitials}
          />
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
