
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
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
      categories: [],
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
      categories: [],
      date: new Date().toISOString().split("T")[0],
      description: "",
    });
  };

  const onSubmit = async (data: CostFormData) => {
    if (isLoading) {
      console.log("Já existe uma submissão em andamento");
      return;
    }

    setIsLoading(true);
    try {
      // Insere o custo
      const { data: newCost, error: costError } = await supabase
        .from("costs")
        .insert({
          name: data.name,
          amount: parseCurrencyToNumber(data.amount),
          date: data.date,
          description: data.description || null,
        })
        .select()
        .single();

      if (costError) throw costError;
      if (!newCost) throw new Error("Falha ao criar custo");

      // Insere as categorias do custo
      if (data.categories.length > 0) {
        const { error: categoriesError } = await supabase
          .from("costs_categories")
          .insert(
            data.categories.map(categoryId => ({
              cost_id: newCost.id,
              category_id: categoryId
            }))
          );

        if (categoriesError) throw categoriesError;
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
