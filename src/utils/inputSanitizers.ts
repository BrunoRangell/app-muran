
// Utilitários de sanitização e normalização de entradas de usuário

export type PasteEvent = React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>;

// Remove caracteres de controle, espaços extras, tags/ângulos e limita tamanho
export function sanitizeText(text: string, opts?: { maxLength?: number; preserveNewlines?: boolean }): string {
  if (!text) return "";
  const { maxLength, preserveNewlines } = opts || {};

  // Normaliza quebras de linha
  let cleaned = text.replace(/\r/g, "");

  // Remove caracteres de controle (mantém \n e \t se preserveNewlines=true)
  cleaned = cleaned.replace(preserveNewlines ? /[\u0000-\u0008\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, " ");

  // Evita colar tags HTML ou scripts simples removendo < e >
  cleaned = cleaned.replace(/[<>]/g, "");

  // Colapsa espaços; preserva quebras de linha se solicitado
  cleaned = preserveNewlines
    ? cleaned.replace(/[^\S\n]+/g, " ")
    : cleaned.replace(/\s+/g, " ");

  cleaned = cleaned.trim();

  if (typeof maxLength === "number" && maxLength > 0) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
}

export function handleTextPaste(e: PasteEvent, onChange: (value: string) => void, opts?: { maxLength?: number; preserveNewlines?: boolean }) {
  e.preventDefault();
  const pasted = e.clipboardData.getData("text");
  const value = sanitizeText(pasted, opts);
  onChange(value);
}

// Normaliza colagem de moeda: extrai apenas dígitos e transforma em número (centavos/100)
export function handleCurrencyPaste(e: PasteEvent, onAmount: (amountNumber: number) => void) {
  e.preventDefault();
  const raw = e.clipboardData.getData("text");
  const digits = (raw || "").replace(/\D/g, "");
  const amount = digits ? parseInt(digits, 10) / 100 : 0;
  onAmount(amount);
}

// Normaliza colagem de telefone: mantém apenas dígitos
export function handlePhonePaste(e: PasteEvent, onDigits: (digits: string) => void) {
  e.preventDefault();
  const raw = e.clipboardData.getData("text");
  const digits = (raw || "").replace(/\D/g, "");
  onDigits(digits);
}
