import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { TeamMember } from "@/types/team";
import { format, parseISO, isSameMonth, isSameYear, addMonths, isAfter, isToday, addDays, isEqual, startOfDay, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface BirthdayCardProps {
  members: TeamMember[];
}

export const BirthdayCard = ({ members }: BirthdayCardProps) => {
  const today = new Date();
  const tomorrow = addDays(today, 1);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const isValidDate = (dateString: string | null): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const getBirthdayDate = (birthday: string | null) => {
    if (!isValidDate(birthday)) return null;
    const date = parseISO(birthday!);
    return new Date(today.getFullYear(), date.getMonth(), date.getDate());
  };

  const getDaysUntilBirthday = (birthday: string | null) => {
    if (!isValidDate(birthday)) return null;
    const birthdayDate = getBirthdayDate(birthday);
    if (!birthdayDate) return null;
    
    if (isAfter(birthdayDate, today)) {
      return differenceInDays(birthdayDate, today) + 1;
    }
    const nextYearBirthday = new Date(
      today.getFullYear() + 1,
      parseISO(birthday!).getMonth(),
      parseISO(birthday!).getDate()
    );
    return differenceInDays(nextYearBirthday, today) + 1;
  };

  const getCurrentMonthBirthdays = () => {
    return members
      .filter(member => {
        if (!isValidDate(member.birthday)) return false;
        const birthdayDate = parseISO(member.birthday!);
        return isSameMonth(birthdayDate, today) && isSameYear(today, today);
      })
      .sort((a, b) => {
        const dateA = getBirthdayDate(a.birthday) || new Date();
        const dateB = getBirthdayDate(b.birthday) || new Date();
        return dateA.getTime() - dateB.getTime();
      });
  };

  const getNextBirthdays = () => {
    const nextYear = addMonths(today, 12);
    return members
      .filter(member => isValidDate(member.birthday))
      .map(member => {
        const birthdayDate = getBirthdayDate(member.birthday);
        if (!birthdayDate) return null;

        if (isAfter(birthdayDate, today)) {
          return { ...member, nextBirthday: birthdayDate };
        }
        const nextYearBirthday = new Date(
          today.getFullYear() + 1,
          parseISO(member.birthday!).getMonth(),
          parseISO(member.birthday!).getDate()
        );
        return { ...member, nextBirthday: nextYearBirthday };
      })
      .filter((member): member is (TeamMember & { nextBirthday: Date }) => member !== null)
      .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime())
      .slice(0, 3);
  };

  const currentMonthBirthdays = getCurrentMonthBirthdays();
  const birthdaysToShow = currentMonthBirthdays.length > 0 
    ? currentMonthBirthdays 
    : getNextBirthdays();

  const formatBirthday = (birthday: string | null) => {
    if (!isValidDate(birthday)) return '';
    return format(parseISO(birthday!), "dd 'de' MMMM", { locale: ptBR });
  };

  const isBirthdayToday = (birthday: string | null) => {
    if (!isValidDate(birthday)) return false;
    const birthdayDate = getBirthdayDate(birthday);
    return birthdayDate ? isToday(birthdayDate) : false;
  };

  const isBirthdayTomorrow = (birthday: string | null) => {
    if (!isValidDate(birthday)) return false;
    const birthdayDate = getBirthdayDate(birthday);
    const startOfTomorrow = startOfDay(tomorrow);
    return birthdayDate ? isEqual(birthdayDate, startOfTomorrow) : false;
  };

  const sortedBirthdays = [...birthdaysToShow].sort((a, b) => {
    const aIsToday = isBirthdayToday(a.birthday);
    const bIsToday = isBirthdayToday(b.birthday);
    const aIsTomorrow = isBirthdayTomorrow(a.birthday);
    const bIsTomorrow = isBirthdayTomorrow(b.birthday);
    
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    if (aIsTomorrow && !bIsTomorrow && !bIsToday) return -1;
    if (!aIsTomorrow && bIsTomorrow && !aIsToday) return 1;
    return 0;
  });

  return (
    <Card className="border-0 shadow-sm hover:scale-105 transition-transform duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
          <Gift className="text-muran-primary" size={20} />
          {currentMonthBirthdays.length > 0 
            ? "Aniversariantes do Mês" 
            : "Próximos Aniversariantes"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedBirthdays.map((member) => {
            const isToday = isBirthdayToday(member.birthday);
            const isTomorrow = isBirthdayTomorrow(member.birthday);
            const daysUntil = getDaysUntilBirthday(member.birthday);
            
            return (
              <div
                key={member.id}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 ${
                  isToday ? 'bg-muran-primary text-white' : 
                  isTomorrow ? 'bg-blue-200 text-blue-800' : 'bg-gray-50 text-gray-900'
                } ${isToday || isTomorrow ? 'shadow-xl' : 'shadow-sm'}`}
              >
                <Avatar className="h-12 w-12 border-2 border-white/20">
                  {member.photo_url ? (
                    <AvatarImage
                      src={member.photo_url}
                      alt={member.name}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-[#ff6e00] text-white text-xl">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${isToday ? 'text-white' : ''}`}>
                    {isToday ? `🎉 ${member.name}` : 
                     isTomorrow ? `🎂 ${member.name}` : 
                     member.name}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={isToday ? 'text-white/90' : 'text-gray-600'}>
                      {formatBirthday(member.birthday)}
                    </span>
                    {!isToday && daysUntil !== null && (
                      <span className={`text-xs ${
                        isTomorrow ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        • {daysUntil} {daysUntil === 1 ? 'dia restante' : 'dias restantes'}
                      </span>
                    )}
                  </div>
                </div>
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
