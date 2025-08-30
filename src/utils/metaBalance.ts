/**
 * Extrai o saldo numérico a partir de uma string exibida pela API Meta Ads.
 * Exemplo de entrada: "Saldo disponível (R$310,29 BRL)".
 * Se não for possível extrair o valor e houver spendCap, retorna spendCap - amountSpent.
 * Caso contrário, retorna null indicando saldo indisponível.
 */
export const parseMetaBalance = (
  displayString?: string | null,
  spendCap?: number | null,
  amountSpent?: number | null
): number | null => {
  if (displayString) {
    const match = displayString.match(/R\$\s*([\d.,]+)/);
    if (match && match[1]) {
      const numeric = parseFloat(match[1].replace(/\./g, "").replace(",", "."));
      if (!isNaN(numeric)) {
        return numeric;
      }
    }
  }

  if (spendCap && spendCap > 0) {
    const spent = amountSpent ?? 0;
    return spendCap - spent;
  }

  return null;
};
