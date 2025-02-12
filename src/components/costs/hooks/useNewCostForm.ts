
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { CostCategory } from "@/types/cost";
import { parseCurrencyToNumber } from "@/utils/formatters";
import { costFormSchema, CostFormData } from "../schemas/costFormSchema";

export function useNewCostForm(onOpenChange: (open: boolean) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CostFormData>({
    resolver: zodResolver(costFormSchema),
    defaultValues: {
      name: "",
      amount: "",
      category: "outros",
      date: new Date().toISOString().split("T")[0],
      description: "",
    },
  });

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    const amount = numericValue ? parseFloat(numericValue) / 100 : 0;
    form.setValue(
      "amount",
      amount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    );
  };

  const resetForm = () => {
    form.reset({
      name: "",
      amount: "",
      category: "outros",
      date: new Date().toISOString().split("T")[0],
      description: "",
    });
  };

  const onSubmit = async (data: CostFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("costs").insert({
        name: data.name,
        amount: parseCurrencyToNumber(data.amount),
        category: data.category as CostCategory,
        date: data.date,
        description: data.description || null,
      });

      if (error) {
        console.error("Erro ao registrar custo:", error);
        throw error;
      }

      toast({
        title: "Custo registrado",
        description: "O custo foi registrado com sucesso!",
      });

      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["costs"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao registrar custo:", error);
      toast({
        title: "Erro ao registrar custo",
        description: "Não foi possível registrar o custo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    handleAmountChange,
    onSubmit,
    resetForm,
  };
}
