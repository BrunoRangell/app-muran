
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "./BudgetFormSchema";

interface PlatformSelectFieldProps {
  form: UseFormReturn<FormData>;
  isSubmitting: boolean;
}

export function PlatformSelectField({ form, isSubmitting }: PlatformSelectFieldProps) {
  return (
    <FormField
      control={form.control}
      name="platform"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Plataforma</FormLabel>
          <Select
            disabled={isSubmitting}
            onValueChange={field.onChange}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma plataforma" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="meta">
                <div className="flex items-center">
                  <Badge className="mr-2 bg-blue-500">Meta</Badge>
                  <span>Meta Ads</span>
                </div>
              </SelectItem>
              <SelectItem value="google">
                <div className="flex items-center">
                  <Badge className="mr-2 bg-red-500">Google</Badge>
                  <span>Google Ads</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
