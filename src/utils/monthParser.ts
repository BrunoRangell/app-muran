/**
 * Utility functions for parsing month strings in different formats
 */

const monthMap: { [key: string]: number } = {
  // Português - primeira letra maiúscula
  'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5,
  'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11,
  // Português - minúscula
  'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
  'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11,
  // Português - maiúscula
  'JAN': 0, 'FEV': 1, 'MAR': 2, 'ABR': 3, 'MAI': 4, 'JUN': 5,
  'JUL': 6, 'AGO': 7, 'SET': 8, 'OUT': 9, 'NOV': 10, 'DEZ': 11
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
    // Text month format - try direct lookup first
    month = monthMap[monthPart];
    if (month === undefined) {
      // Try case-insensitive lookup
      const monthLower = monthPart.toLowerCase();
      month = monthMap[monthLower];
      if (month === undefined) {
        throw new Error(`Invalid month: ${monthPart}. Expected format: 'Jan/25' or '6/25'`);
      }
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