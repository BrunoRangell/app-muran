
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

/**
 * Calcula o orçamento diário ideal para um cliente com base no orçamento mensal total
 * e na data atual (ponderando os dias restantes no mês)
 */
export const calculateIdealDailyBudget = (totalMonthlyBudget: number, currentDate: Date = new Date()): number => {
  // Obter a data no fuso horário de Brasília
  const today = new Date(currentDate);
  
  // Calcular o número total de dias no mês atual
  const year = today.getFullYear();
  const month = today.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Calcular dias restantes (incluindo o dia atual)
  const dayOfMonth = today.getDate();
  const remainingDays = totalDaysInMonth - dayOfMonth + 1;
  
  // Calcular orçamento diário ideal (orçamento total dividido pelos dias restantes)
  if (remainingDays <= 0 || totalMonthlyBudget <= 0) return 0;
  
  return totalMonthlyBudget / remainingDays;
};

/**
 * Gera uma recomendação com base na comparação entre o orçamento diário atual e o ideal
 */
export const generateRecommendation = (currentDailyBudget: number, idealDailyBudget: number): string => {
  // Evitar divisão por zero
  if (idealDailyBudget === 0) return "Não foi possível calcular uma recomendação válida";
  
  // Calcular a diferença percentual
  const percentDifference = ((currentDailyBudget - idealDailyBudget) / idealDailyBudget) * 100;
  
  // Margem de tolerância de 10%
  if (Math.abs(percentDifference) <= 10) {
    return "Manter orçamento diário atual";
  }
  
  // Se o orçamento atual for menor que o ideal
  if (currentDailyBudget < idealDailyBudget) {
    const increaseAmount = idealDailyBudget - currentDailyBudget;
    return `Aumentar orçamento diário em R$ ${increaseAmount.toFixed(2)}`;
  }
  
  // Se o orçamento atual for maior que o ideal
  const decreaseAmount = currentDailyBudget - idealDailyBudget;
  return `Diminuir orçamento diário em R$ ${decreaseAmount.toFixed(2)}`;
};
