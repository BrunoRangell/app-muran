/**
 * Utility functions for parsing month strings in different formats
 */

const monthMap: { [key: string]: number } = {
  'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5,
  'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11
};

/**
 * Parse month string in format "Jan/25" or "6/25" to date range
 * @param monthStr - Month string in format "Jan/25" or "6/25"
 * @returns Object with monthStart and monthEnd dates
 */
export const parseMonthString = (monthStr: string) => {
  const [monthPart, yearPart] = monthStr.split('/');
  
  let month: number;
  
  // Check if it's text month (Jan/25) or numeric month (6/25)
  if (isNaN(parseInt(monthPart))) {
    // Text month format
    month = monthMap[monthPart];
    if (month === undefined) {
      throw new Error(`Invalid month: ${monthPart}`);
    }
  } else {
    // Numeric month format
    month = parseInt(monthPart) - 1; // JavaScript months are 0-indexed
  }
  
  const year = parseInt(yearPart);
  const fullYear = year < 50 ? 2000 + year : (year < 100 ? 1900 + year : year);
  
  const monthStart = new Date(fullYear, month, 1);
  const monthEnd = new Date(fullYear, month + 1, 0); // Last day of the month
  
  return { monthStart, monthEnd, fullYear, month };
};