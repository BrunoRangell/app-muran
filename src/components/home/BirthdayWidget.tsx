import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cake } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Birthday {
  name: string;
  birthday: string;
}

export const BirthdayWidget = () => {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [isNextMonth, setIsNextMonth] = useState(false);

  useEffect(() => {
    const fetchBirthdays = async () => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;

      let { data: currentMonthBirthdays, error } = await supabase
        .from('team_members')
        .select('name, birthday')
        .not('birthday', 'is', null);

      if (error) {
        console.error("Erro ao buscar aniversariantes:", error);
        return;
      }

      const filteredBirthdays = currentMonthBirthdays
        .filter(member => new Date(member.birthday).getMonth() + 1 === currentMonth)
        .sort((a, b) => new Date(a.birthday).getDate() - new Date(b.birthday).getDate());

      if (filteredBirthdays.length === 0) {
        const nextMonth = addMonths(currentDate, 1);
        const nextMonthNumber = nextMonth.getMonth() + 1;

        const nextMonthBirthdays = currentMonthBirthdays
          .filter(member => new Date(member.birthday).getMonth() + 1 === nextMonthNumber)
          .sort((a, b) => new Date(a.birthday).getDate() - new Date(b.birthday).getDate());

        setBirthdays(nextMonthBirthdays);
        setIsNextMonth(true);
      } else {
        setBirthdays(filteredBirthdays);
        setIsNextMonth(false);
      }
    };

    fetchBirthdays();
  }, []);

  if (birthdays.length === 0) return null;

  return (
    <Card className="transform transition-all hover:scale-105">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-muran-primary">
          <Cake className="h-5 w-5" />
          {isNextMonth ? "Próximos Aniversariantes" : "Aniversariantes do Mês"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {birthdays.map((birthday, index) => (
            <li key={index} className="flex items-center gap-2 text-gray-600">
              <span className="font-medium">{birthday.name}</span>
              <span className="text-sm">
                {format(new Date(birthday.birthday), "dd 'de' MMMM", { locale: ptBR })}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};