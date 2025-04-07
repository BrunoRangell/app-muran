export const formatCurrency = (value: string | number, includeSymbol: boolean = true) => {
  // Se o valor for undefined ou null, retorna R$ 0,00
  if (value == null) return includeSymbol ? 'R$ 0,00' : '0,00';

  let numericValue: number;

  if (typeof value === 'string') {
    // Remove tudo que não for número ou ponto/vírgula decimal
    const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
    numericValue = parseFloat(cleanValue);
  } else {
    numericValue = value;
  }

  // Se o valor não for um número válido, retorna R$ 0,00
  if (isNaN(numericValue)) {
    console.error('Valor inválido para formatação:', { value, tipo: typeof value });
    return includeSymbol ? 'R$ 0,00' : '0,00';
  }

  try {
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: includeSymbol ? "currency" : "decimal",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue);
    
    return formatted;
  } catch (error) {
    console.error('Erro ao formatar valor:', { valor: numericValue, erro: error });
    return includeSymbol ? 'R$ 0,00' : '0,00';
  }
};

export const parseCurrencyToNumber = (value: string) => {
  if (!value) return 0;

  try {
    // Remove o símbolo da moeda e espaços
    const cleanValue = value
      .replace(/^R\$\s*/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    const numberValue = parseFloat(cleanValue);
    
    if (isNaN(numberValue)) {
      console.error('Valor inválido para conversão:', value);
      return 0;
    }

    return numberValue;
  } catch (error) {
    console.error('Erro ao converter valor para número:', error);
    return 0;
  }
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
