import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { handleTextPaste } from "@/utils/inputSanitizers";

interface BaseProps {
  maxLengthLimit?: number;
  preserveNewlines?: boolean; // Apenas para Textarea
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & BaseProps;
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps;

/**
 * Sanitização customizada local — permite espaços,
 * mas remove caracteres especiais e símbolos indevidos.
 */
const sanitizeText = (text: string, options: { maxLength?: number; preserveNewlines?: boolean } = {}) => {
  const { maxLength, preserveNewlines } = options;

  // 🔧 Mantém letras, números, acentos e espaços.
  // Remove apenas símbolos, emojis e caracteres não textuais.
  let sanitized = text.replace(/[^\p{L}\p{N}\s]/gu, "");

  // Se não queremos quebras de linha (caso de Input)
  if (!preserveNewlines) {
    sanitized = sanitized.replace(/[\r\n]+/g, " ");
  }

  // Aplica limite de caracteres, se definido
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
};

export const SanitizedInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, onPaste, maxLengthLimit, ...rest }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = sanitizeText(e.target.value, { maxLength: maxLengthLimit });
      e.target.value = next;
      onChange?.(e);
    };

    return (
      <Input
        ref={ref}
        {...rest}
        onChange={handleChange}
        onPaste={(e) =>
          handleTextPaste(
            e as any,
            (v) => {
              const sanitized = sanitizeText(v, { maxLength: maxLengthLimit });
              const syntheticEvent = {
                ...e,
                target: { ...(e.target as any), value: sanitized },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              onChange?.(syntheticEvent);
            },
            { maxLength: maxLengthLimit },
          )
        }
      />
    );
  },
);
SanitizedInput.displayName = "SanitizedInput";

export const SanitizedTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ onChange, onPaste, maxLengthLimit, preserveNewlines = true, ...rest }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = sanitizeText(e.target.value, {
        maxLength: maxLengthLimit,
        preserveNewlines,
      });
      e.target.value = next;
      onChange?.(e);
    };

    return (
      <Textarea
        ref={ref}
        {...rest}
        onChange={handleChange}
        onPaste={(e) =>
          handleTextPaste(
            e as any,
            (v) => {
              const sanitized = sanitizeText(v, {
                maxLength: maxLengthLimit,
                preserveNewlines,
              });
              const syntheticEvent = {
                ...e,
                target: { ...(e.target as any), value: sanitized },
              } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
              onChange?.(syntheticEvent);
            },
            { maxLength: maxLengthLimit, preserveNewlines },
          )
        }
      />
    );
  },
);
SanitizedTextarea.displayName = "SanitizedTextarea";
