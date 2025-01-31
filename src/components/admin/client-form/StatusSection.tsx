import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ClientFormData, ACQUISITION_CHANNELS } from "@/types/client";
import { useState, useEffect } from "react";

interface StatusSectionProps {
  form: UseFormReturn<ClientFormData>;
}

export const StatusSection = ({ form }: StatusSectionProps) => {
  const [showCustomChannel, setShowCustomChannel] = useState(false);

  useEffect(() => {
    const currentChannel = form.getValues("acquisitionChannel");
    setShowCustomChannel(currentChannel === "outro");
  }, [form]);

  return (
    <>
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="acquisitionChannel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Canal de Aquisição</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                setShowCustomChannel(value === "outro");
              }} 
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o canal de aquisição" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {ACQUISITION_CHANNELS.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {channel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {showCustomChannel && (
        <FormField
          control={form.control}
          name="customAcquisitionChannel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Especifique o Canal</FormLabel>
              <FormControl>
                <Input placeholder="Digite o canal de aquisição" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
};