
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
}

interface UnifiedFormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  type?: "text" | "email" | "password" | "number" | "textarea" | "select" | "checkbox" | "switch" | "date";
  placeholder?: string;
  description?: string;
  options?: SelectOption[];
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export function UnifiedFormField<T extends FieldValues>({
  form,
  name,
  label,
  type = "text",
  placeholder,
  description,
  options = [],
  className,
  required = false,
  disabled = false,
}: UnifiedFormFieldProps<T>) {
  const renderControl = () => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            placeholder={placeholder}
            disabled={disabled}
            className="resize-none"
            {...form.register(name)}
          />
        );

      case "select":
        return (
          <Select
            onValueChange={(value) => form.setValue(name, value as any)}
            defaultValue={form.getValues(name)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={form.watch(name)}
              onCheckedChange={(checked) => form.setValue(name, checked as any)}
              disabled={disabled}
            />
            <span className="text-sm">{placeholder}</span>
          </div>
        );

      case "switch":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={form.watch(name)}
              onCheckedChange={(checked) => form.setValue(name, checked as any)}
              disabled={disabled}
            />
            <span className="text-sm">{placeholder}</span>
          </div>
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch(name) && "text-muted-foreground"
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch(name) ? (
                  format(new Date(form.watch(name)), "PPP", { locale: ptBR })
                ) : (
                  <span>{placeholder || "Selecione uma data"}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.watch(name) ? new Date(form.watch(name)) : undefined}
                onSelect={(date) => form.setValue(name, date as any)}
                disabled={disabled}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      default:
        return (
          <Input
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            {...form.register(name, { 
              valueAsNumber: type === "number" ? true : false 
            })}
          />
        );
    }
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem className={className}>
          <FormLabel className={required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""}>
            {label}
          </FormLabel>
          <FormControl>
            {renderControl()}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
