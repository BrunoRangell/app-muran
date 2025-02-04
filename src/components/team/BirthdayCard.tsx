import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { TeamMember } from "@/types/team";
import { format, parseISO, isSameMonth, isSameYear, addMonths, isAfter, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BirthdayCardProps {
  members: TeamMember[];
}

export const BirthdayCard = ({ members }: BirthdayCardProps) => {
  const today = new Date();
  
  const getBirthdayDate = (birthday: string) => {
    const date = parseISO(birthday);
    return new Date(today.getFullYear(), date.getMonth(), date.getDate());
  };

  const getCurrentMonthBirthdays = () => {
    return members
      .filter(member => {
        const birthdayDate = parseISO(member.birthday);
        return isSameMonth(birthdayDate, today) && isSameYear(today, today);
      })
      .sort((a, b) => {
        const dateA = getBirthdayDate(a.birthday);
        const dateB = getBirthdayDate(b.birthday);
        return dateA.getTime() - dateB.getTime();
      });
  };

  const getNextBirthdays = () => {
    const nextYear = addMonths(today, 12);
    return members
      .map(member => {
        const birthdayDate = getBirthdayDate(member.birthday);
        if (isAfter(birthdayDate, today)) {
          return { ...member, nextBirthday: birthdayDate };
        }
        // Se o aniversário já passou este ano, considere o próximo ano
        const nextYearBirthday = new Date(
          today.getFullYear() + 1,
          parseISO(member.birthday).getMonth(),
          parseISO(member.birthday).getDate()
        );
        return { ...member, nextBirthday: nextYearBirthday };
      })
      .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime())
      .slice(0, 3);
  };

  const currentMonthBirthdays = getCurrentMonthBirthdays();
  const birthdaysToShow = currentMonthBirthdays.length > 0 
    ? currentMonthBirthdays 
    : getNextBirthdays();

  const formatBirthday = (birthday: string) => {
    return format(parseISO(birthday), "dd 'de' MMMM", { locale: ptBR });
  };

  // Função para verificar se o aniversário é hoje
  const isBirthdayToday = (birthday: string) => {
    const birthdayDate = getBirthdayDate(birthday);
    return isToday(birthdayDate);
  };

  return (
    
      
        
          
          {currentMonthBirthdays.length > 0 
            ? "Aniversariantes do Mês" 
            : "Próximos Aniversariantes"}
        
      
      
        

          {birthdaysToShow.map((member) => {
            const isToday = isBirthdayToday(member.birthday);
            return (
              

                {isToday ? `🎉 ${member.name} (Hoje!)` : member.name}
                
                  {formatBirthday(member.birthday)}
                
                {isToday && 🎉}
              

            );
          })}
          {birthdaysToShow.length === 0 && (
            

              Nenhum aniversariante encontrado
            


          )}
        

      
    
  );
};
