
import { format as dateFnsFormat, differenceInDays, startOfToday } from "date-fns";

export const format = dateFnsFormat;

export const getDaysRemaining = (endDate: string) => {
  const today = startOfToday();
  const end = new Date(endDate);
  // Adicionamos +1 para incluir o dia atual na contagem
  return differenceInDays(end, today) + 1;
};
