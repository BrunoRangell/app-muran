
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata uma data para exibição no formato brasileiro (DD/MM/YYYY)
 * @param dateString String de data a ser formatada
 * @returns Data formatada no padrão brasileiro
 */
export function formatDateBr(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  
  try {
    // Se for uma string de data, usar parseISO para preservar a data original
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.error("Data inválida:", dateString);
      return typeof dateString === 'string' ? dateString : '';
    }
    
    // Formatar a data no padrão brasileiro sem conversão de fuso horário
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return typeof dateString === 'string' ? dateString : '';
  }
}

/**
 * Formata uma data para o formato ISO (YYYY-MM-DD) para envio ao banco de dados
 * @param dateString String de data a ser formatada
 * @returns Data formatada no padrão ISO
 */
export function formatDateIso(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.error("Data inválida:", dateString);
      return typeof dateString === 'string' ? dateString : '';
    }
    
    // Formatar a data no padrão ISO
    return format(date, "yyyy-MM-dd");
  } catch (error) {
    console.error("Erro ao formatar data ISO:", error, dateString);
    return typeof dateString === 'string' ? dateString : '';
  }
}
