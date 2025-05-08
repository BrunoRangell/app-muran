
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

// Função auxiliar para verificar se uma data é válida e formatá-la de forma segura
export const formatSafeDate = (date: Date | string | null | undefined, defaultFormat: string = 'dd/MM/yyyy'): string => {
  if (!date) return '';
  
  // Se for uma string de data, tentar converter para objeto Date
  const dateObject = typeof date === 'string' ? new Date(`${date}T12:00:00Z`) : date;
  
  // Verificar se a data é válida antes de formatar
  if (!(dateObject instanceof Date) || !isValid(dateObject)) {
    console.warn('Data inválida detectada:', date);
    return '';
  }
  
  try {
    return format(dateObject, defaultFormat, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Data original:', date);
    return '';
  }
};

// Função para converter data para formato YYYY-MM-DD sem ajuste de fuso horário
export const formatDateToYYYYMMDD = (date: Date) => {
  if (!isValid(date)) {
    console.error('Tentativa de formatar data inválida:', date);
    return new Date().toISOString().split('T')[0]; // Fallback para hoje
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
