
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { handleTextPaste, sanitizeText } from "@/utils/inputSanitizers";

interface BaseProps {
  maxLengthLimit?: number;
  preserveNewlines?: boolean; // Apenas para Textarea
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & BaseProps;

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps;

export const SanitizedInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, onPaste, maxLengthLimit, ...rest }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = sanitizeText(e.target.value, { maxLength: maxLengthLimit });
      // Clona o evento para atualizar o target.value antes de propagar
      e.target.value = next;
      onChange?.(e);
    };

    return (
      <Input
        ref={ref}
        {...rest}
        onChange={handleChange}
        onPaste={(e) => handleTextPaste(e as any, (v) => {
          // Monta um evento sintético simples
          const syntheticEvent = { ...e, target: { ...(e.target as any), value: v } } as unknown as React.ChangeEvent<HTMLInputElement>;
          onChange?.(syntheticEvent);
        }, { maxLength: maxLengthLimit })}
      />
    );
  }
);
SanitizedInput.displayName = "SanitizedInput";

export const SanitizedTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ onChange, onPaste, maxLengthLimit, preserveNewlines = true, ...rest }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = sanitizeText(e.target.value, { maxLength: maxLengthLimit, preserveNewlines });
      e.target.value = next;
      onChange?.(e);
    };

    return (
      <Textarea
        ref={ref}
        {...rest}
        onChange={handleChange}
        onPaste={(e) => handleTextPaste(e as any, (v) => {
          const syntheticEvent = { ...e, target: { ...(e.target as any), value: v } } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
          onChange?.(syntheticEvent);
        }, { maxLength: maxLengthLimit, preserveNewlines })}
      />
    );
  }
);
SanitizedTextarea.displayName = "SanitizedTextarea";
