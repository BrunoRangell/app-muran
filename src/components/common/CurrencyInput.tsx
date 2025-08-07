
import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/formatters";
import { handleCurrencyPaste } from "@/utils/inputSanitizers";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  // Valor numérico em reais (ex.: 1234.56)
  value?: number;
  defaultValue?: number;
  onValueChange?: (payload: { numeric: number; formatted: string }) => void;
}

// Input de moeda BRL com formatação em tempo real e suporte a colagem
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  defaultValue,
  onValueChange,
  disabled,
  placeholder = "R$ 0,00",
  id,
  name,
  className,
  ...rest
}) => {
  const initial = useMemo(() => (value ?? defaultValue ?? 0), [value, defaultValue]);
  const [display, setDisplay] = useState<string>(() => formatCurrency(initial));

  // Sincroniza display quando value externo muda
  useEffect(() => {
    if (typeof value === "number") {
      setDisplay(formatCurrency(value));
    }
  }, [value]);

  const updateFromAmount = (amount: number) => {
    const formatted = formatCurrency(amount || 0);
    setDisplay(formatted);
    onValueChange?.({ numeric: amount || 0, formatted });
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    const amount = digits ? parseInt(digits, 10) / 100 : 0;
    updateFromAmount(amount);
  };

  return (
    <Input
      id={id}
      name={name}
      inputMode="numeric"
      disabled={disabled}
      placeholder={placeholder}
      value={display}
      onChange={onChange}
      onPaste={(e) => handleCurrencyPaste(e, updateFromAmount)}
      className={className}
      {...rest}
    />
  );
};
