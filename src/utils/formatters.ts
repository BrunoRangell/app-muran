export const formatCurrency = (value: string) => {
  const numericValue = value.replace(/\D/g, "");
  const floatValue = parseFloat(numericValue) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(floatValue);
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