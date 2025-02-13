
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Cost, CostMainCategory, CostSubcategory } from "@/types/cost";
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
      main_category: "custos_diretos_operacao",
      subcategory: "marketing_aquisicao",
      date: new Date().toISOString().split("T")[0],
      description: "",
      tags: [],
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
        main_category: cost.main_category,
        subcategory: cost.subcategory,
        date: cost.date,
        description: cost.description || "",
        tags: cost.tags?.map(tag => tag.name) || [],
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
        main_category: cost.main_category,
        subcategory: cost.subcategory,
        date: cost.date,
        description: cost.description || "",
        tags: cost.tags?.map(tag => tag.name) || [],
      });
    }
  };

  const onSubmit = async (data: CostFormData) => {
    if (!cost) return;
    
    setIsLoading(true);
    try {
      const { data: updatedCost, error } = await supabase
        .from("costs")
        .update({
          name: data.name,
          amount: parseCurrencyToNumber(data.amount),
          main_category: data.main_category as CostMainCategory,
          subcategory: data.subcategory as CostSubcategory,
          date: data.date,
          description: data.description || null,
        })
        .eq("id", cost.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar custo:", error);
        throw error;
      }

      if (!updatedCost) {
        throw new Error("Não foi possível atualizar o custo");
      }

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
