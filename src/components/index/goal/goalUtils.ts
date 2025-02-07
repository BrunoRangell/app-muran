
import { format as dateFnsFormat, differenceInDays, startOfToday } from "date-fns";

export const format = dateFnsFormat;

export const getDaysRemaining = (endDate: string) => {
  const today = startOfToday();
  const end = new Date(endDate);
  return differenceInDays(end, today) + 1;
};
