/**
 * Extrai o saldo numérico a partir de uma string exibida pela API Meta Ads.
 * Exemplo de entrada: "Saldo disponível (R$310,29 BRL)".
 * Se não for possível extrair o valor e houver spendCap, retorna (spendCap - amountSpent) / 100.
 * Caso contrário, retorna null indicando saldo indisponível.
 */
export const parseMetaBalance = (
  displayString?: string | null,
  spendCap?: number | string | null,
  amountSpent?: number | string | null
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

  if (spendCap && Number(spendCap) > 0) {
    const spent =
      amountSpent !== undefined && amountSpent !== null
        ? Number(amountSpent)
        : 0;
    return (Number(spendCap) - spent) / 100;
  }

  return null;
};
