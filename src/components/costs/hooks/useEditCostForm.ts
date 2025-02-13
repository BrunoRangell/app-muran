
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Cost } from "@/types/cost";
import { parseCurrencyToNumber } from "@/utils/formatters";
import { costFormSchema, CostFormData } from "../schemas/costFormSchema";

export function useEditCostForm(cost: Cost | null, onOpenChange: (open: boolean) => void) {
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

  useEffect(() => {
    if (cost) {
      form.reset({
        name: cost.name,
        amount: cost.amount.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        categories: cost.categories || [],
        date: cost.date,
        description: cost.description || "",
      });
    }
  }, [cost, form]);

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
    if (cost) {
      form.reset({
        name: cost.name,
        amount: cost.amount.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        categories: cost.categories || [],
        date: cost.date,
        description: cost.description || "",
      });
    }
  };

  const onSubmit = async (data: CostFormData) => {
    if (!cost) return;
    
    setIsLoading(true);
    try {
      // Atualiza o custo
      const { error: costError } = await supabase
        .from("costs")
        .update({
          name: data.name,
          amount: parseCurrencyToNumber(data.amount),
          date: data.date,
          description: data.description || null,
        })
        .eq("id", cost.id);

      if (costError) throw costError;

      // Remove todas as categorias antigas
      const { error: deleteError } = await supabase
        .from("costs_categories")
        .delete()
        .eq("cost_id", cost.id);

      if (deleteError) throw deleteError;

      // Insere as novas categorias
      const { error: categoriesError } = await supabase
        .from("costs_categories")
        .insert(
          data.categories.map(categoryId => ({
            cost_id: cost.id,
            category_id: categoryId
          }))
        );

      if (categoriesError) throw categoriesError;

      toast({
        title: "Custo atualizado",
        description: "O custo foi atualizado com sucesso!",
      });

      await queryClient.invalidateQueries({ queryKey: ["costs"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar custo:", error);
      toast({
        title: "Erro ao atualizar custo",
        description: "Não foi possível atualizar o custo. Tente novamente.",
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
