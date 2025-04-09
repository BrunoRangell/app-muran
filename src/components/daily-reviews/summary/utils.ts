import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

/**
 * Calcula quantos dias faltam para o final do mês
 * Inclui o dia atual na contagem
 */
export const getRemainingDaysInMonth = (): number => {
  const today = getCurrentDateInBrasiliaTz();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return lastDayOfMonth.getDate() - today.getDate() + 1; // +1 para incluir o dia atual
};

/**
 * Retorna a data atual no fuso horário de Brasília
 */
export function getCurrentDateInBrasiliaTz(): Date {
  // Cria uma nova data usando a data atual
  const date = new Date();
  
  // Offset para Brasília (GMT-3)
  const brasiliaOffset = -3 * 60; // em minutos
  
  // Obtém o offset atual do navegador em minutos
  const currentOffset = date.getTimezoneOffset();
  
  // Calcula a diferença em minutos entre o fuso do navegador e Brasília
  const offsetDiff = currentOffset + brasiliaOffset;
  
  // Ajusta a data adicionando a diferença de offset em milissegundos
  date.setMinutes(date.getMinutes() + offsetDiff);
  
  return date;
}

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
