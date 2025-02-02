export const formatCurrency = (value: string | number) => {
  const numericValue = typeof value === 'string' ? 
    parseFloat(value.replace(/\D/g, "")) / 100 :
    value;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
};

export const parseCurrencyToNumber = (value: string) => {
  const cleanValue = value
    .replace(/^R\$\s*/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const numberValue = parseFloat(cleanValue);
  console.log('Parsing currency value:', { original: value, cleaned: cleanValue, final: numberValue });
  return numberValue;
};

export const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Ajusta o fuso horário para considerar UTC
  date.setUTCHours(0, 0, 0, 0);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};