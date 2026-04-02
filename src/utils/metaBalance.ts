/**
 * Extrai o saldo numérico a partir de uma string exibida pela API Meta Ads.
 * Exemplo de entrada: "Saldo disponível (R$310,29 BRL)".
 * Se não for possível extrair o valor e houver spendCap, retorna spendCap - amountSpent.
 * Os valores de spendCap e amountSpent devem estar em reais.
 * Caso contrário, retorna null indicando saldo indisponível.
 */
export const parseMetaBalance = (
  displayString?: string | null,
  spendCap?: number | string | null,
  amountSpent?: number | string | null
): number | null => {
  if (displayString) {
    // Tenta capturar número APÓS R$ (ex: "R$ 310,29" ou "R$310,29")
    let match = displayString.match(/R\$\s*([\d.,\s]+)/);
    // Se não encontrou, tenta capturar número ANTES de R$ (ex: "40 943,86 R$")
    if (!match) {
      match = displayString.match(/([\d.,\s]+)\s*R\$/);
    }
    if (match && match[1]) {
      // Remove espaços (separador de milhares), pontos e converte vírgula para ponto decimal
      const cleaned = match[1].trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
      const numeric = parseFloat(cleaned);
      if (!isNaN(numeric)) {
        return numeric;
      }
    }
  }

  if (spendCap && Number(spendCap) > 0) {
    const spent =
      amountSpent !== undefined && amountSpent !== null
        ? Number(amountSpent)
        : 0;
    return Number(spendCap) - spent;
  }

  return null;
};
