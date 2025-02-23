
export const formatCurrency = (value: string | number) => {
  // Se o valor for undefined ou null, retorna R$ 0,00
  if (value == null) return 'R$ 0,00';

  // Se for string, converte para número
  const numericValue = typeof value === 'string' ? 
    Number(value.replace(/\D/g, "")) / 100 :
    value;

  // Se o valor não for um número válido, retorna R$ 0,00
  if (isNaN(numericValue)) {
    console.error('Valor inválido para formatação:', value);
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
};

export const parseCurrencyToNumber = (value: string) => {
  if (!value) return 0;

  const cleanValue = value
    .replace(/^R\$\s*/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const numberValue = parseFloat(cleanValue);
  
  if (isNaN(numberValue)) {
    console.error('Erro ao converter valor para número:', { valor_original: value, valor_limpo: cleanValue });
    return 0;
  }

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
  
  try {
    // Garantir que a data está no formato YYYY-MM-DD
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    
    // Criar data com horário meio-dia para evitar problemas de fuso horário
    const date = new Date(year, month - 1, day, 12, 0, 0);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.error('Data inválida:', dateString);
      return '';
    }

    console.log('Formatando data:', {
      original: dateString,
      parsed: date.toISOString(),
      final: new Intl.DateTimeFormat('pt-BR').format(date)
    });

    return new Intl.DateTimeFormat('pt-BR').format(date);
  } catch (error) {
    console.error('Erro ao formatar data:', error, dateString);
    return '';
  }
};
