import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

/**
 * Calcula quantos dias faltam para o final do mês
 */
export const getRemainingDaysInMonth = (): number => {
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const diff = lastDayOfMonth.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));
  return days;
};

/**
 * Retorna a data atual no fuso horário de Brasília
 */
export const getCurrentDateInBrasiliaTz = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
};

/**
 * Formata uma data no fuso horário de Brasília com o formato especificado
 */
export const formatDateInBrasiliaTz = (
  date: Date | string | null,
  format: string = 'dd/MM/yyyy HH:mm',
  locale: string = 'pt-BR'
) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      console.error('Data inválida:', date);
      return '';
    }
    
    const brasiliaTz = 'America/Sao_Paulo';
    return formatInTimeZone(dateObj, brasiliaTz, format, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
};
