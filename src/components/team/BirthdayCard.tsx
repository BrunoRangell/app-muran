import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { TeamMember } from "@/types/team";
import { format, parseISO, isSameMonth, isSameYear, addMonths, isAfter, isToday, addDays, isEqual, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BirthdayCardProps {
  members: TeamMember[];
}

export const BirthdayCard = ({ members }: BirthdayCardProps) => {
  const today = new Date();
  const tomorrow = addDays(today, 1);

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

  // Função para verificar se o aniversário é amanhã
  const isBirthdayTomorrow = (birthday: string) => {
    const birthdayDate = getBirthdayDate(birthday);
    const startOfTomorrow = startOfDay(tomorrow); // Ignora a hora ao comparar
    return isEqual(birthdayDate, startOfTomorrow); // Comparar somente data
  };

  // Melhorando a ordenação para colocar aniversariantes de hoje e amanhã no topo
  const sortedBirthdays = [...birthdaysToShow].sort((a, b) => {
    const aIsToday = isBirthdayToday(a.birthday);
    const bIsToday = isBirthdayToday(b.birthday);
    const aIsTomorrow = isBirthdayTomorrow(a.birthday);
    const bIsTomorrow = isBirthdayTomorrow(b.birthday);
    
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    if (aIsTomorrow && !bIsTomorrow && !bIsToday) return -1;
    if (!aIsTomorrow && bIsTomorrow && !aIsToday) return 1;
    // Se ambos ou nenhum forem de hoje ou amanhã, mantém a ordenação original
    return 0;
  });

  return (
    <Card className="shadow-lg border-t-4 border-muran-primary hover:scale-105 transition-transform duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
          <Gift className="text-muran-primary" size={20} />
          {currentMonthBirthdays.length > 0 
            ? "Aniversariantes do Mês" 
            : "Próximos Aniversariantes"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedBirthdays.map((member) => {
            const isToday = isBirthdayToday(member.birthday);
            const isTomorrow = isBirthdayTomorrow(member.birthday);
            return (
              <div
                key={member.id}
                className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                  isToday ? 'bg-muran-primary text-white' : 
                  isTomorrow ? 'bg-blue-200 text-blue-800' : 'bg-gray-50 text-gray-900'
                } ${isToday || isTomorrow ? 'shadow-xl' : 'shadow-sm'}`}
              >
                <span className={`font-semibold ${isToday ? 'text-white' : ''}`}>
                  {isToday ? `🎉 ${member.name} (Hoje!)` : isTomorrow ? `🎂 ${member.name} (Amanhã!)` : member.name}
                </span>
                <span className={`font-medium ${isToday ? 'text-gray-200' : isTomorrow ? 'text-blue-600' : 'text-gray-600'}`}>
                  {formatBirthday(member.birthday)}
                </span>
                {isToday && <span className="ml-2 text-white">🎉</span>}
                {isTomorrow && <span className="ml-2 text-blue-800">🎂</span>}
              </div>
            );
          })}
          {sortedBirthdays.length === 0 && (
            <p className="text-center text-gray-600 font-medium">
              Nenhum aniversariante encontrado
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
